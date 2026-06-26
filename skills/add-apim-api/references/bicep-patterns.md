# APIM API Bicep Patterns

Reference patterns for creating APIs in Azure API Management with Bicep.

## File Structure

Each API requires these files:

```text
infra/modules/api-management/
├── api-management.bicep     # Main orchestrator (add module reference here)
├── apis/
│   └── {api-name}.bicep     # API definition
├── operations/
│   └── {api-name}-operations.bicep  # API operations
└── policies/
    └── {api-name}-policy.bicep      # (Optional) Custom policy
```

## API Definition Template

Create `infra/modules/api-management/apis/{api-name}.bicep`:

```bicep
// ============================================================================
// {ApiName} - {Short Description}
// {Access info: Open access OR Requires subscription}
// ============================================================================

metadata name = '{ApiName} Module'
metadata description = '{Full description of what the API provides}'
metadata version = '1.0.0'

@description('Name of the API Management service')
param apimName string

// ============================================================================
// Reference existing APIM service
// ============================================================================

resource apimService 'Microsoft.ApiManagement/service@2023-09-01-preview' existing = {
  name: apimName
}

// ============================================================================
// API Definition
// ============================================================================

resource {apiName}Api 'Microsoft.ApiManagement/service/apis@2023-09-01-preview' = {
  parent: apimService
  name: '{api-name}'  // kebab-case, used in product associations
  properties: {
    displayName: '{Human-Readable API Name}'
    description: '{Detailed description for Developer Portal}'
    path: '{url-path}'  // Base path without leading slash (e.g., 'documents')
    protocols: ['https']
    serviceUrl: '{backend-url}'  // Full URL to backend API
    subscriptionRequired: true   // Set false for open APIs
    apiType: 'http'
  }
}

// ============================================================================
// API Policy
// ============================================================================

resource {apiName}ApiPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-09-01-preview' = {
  parent: {apiName}Api
  name: 'policy'
  properties: {
    format: 'xml'
    value: '''
<policies>
  <inbound>
    <base />
    <!-- CORS policy for Developer Portal and browser access -->
    <cors allow-credentials="false">
      <allowed-origins>
        <origin>*</origin>
      </allowed-origins>
      <allowed-methods preflight-result-max-age="300">
        <method>GET</method>
        <method>OPTIONS</method>
      </allowed-methods>
      <allowed-headers>
        <header>*</header>
      </allowed-headers>
      <expose-headers>
        <header>*</header>
      </expose-headers>
    </cors>
    <!-- Rate limiting -->
    <rate-limit-by-key calls="100" renewal-period="60" counter-key="@(context.Subscription != null ? context.Subscription.Id : context.Request.IpAddress)" increment-condition="@(context.Response.StatusCode >= 200 &amp;&amp; context.Response.StatusCode &lt; 400)" />
    <!-- Daily quota -->
    <quota-by-key calls="10000" renewal-period="86400" counter-key="@(context.Subscription != null ? context.Subscription.Id : context.Request.IpAddress)" />
    <!-- Cache lookup -->
    <cache-lookup vary-by-developer="false" vary-by-developer-groups="false" downstream-caching-type="public" caching-type="internal" />
  </inbound>
  <backend>
    <forward-request />
  </backend>
  <outbound>
    <base />
    <cache-store duration="300" />
  </outbound>
  <on-error>
    <base />
  </on-error>
</policies>
'''
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('The name of the API')
output apiName string = {apiName}Api.name

@description('The resource ID of the API')
output apiId string = {apiName}Api.id
```

### Key Decisions

| Property | Open API (no auth) | Protected API |
|----------|-------------------|---------------|
| `subscriptionRequired` | `false` | `true` |
| Rate limit key | `context.Request.IpAddress` | `context.Subscription.Id` |

## Operations Template

Create `infra/modules/api-management/operations/{api-name}-operations.bicep`:

```bicep
// ============================================================================
// {ApiName} Operations
// Defines OpenAPI operations for {API Description}
// ============================================================================

metadata name = '{ApiName} Operations Module'
metadata description = 'API operations for {API Description}'
metadata version = '1.0.0'

@description('Name of the API Management service')
param apimName string

// ============================================================================
// Reference existing resources
// ============================================================================

resource apimService 'Microsoft.ApiManagement/service@2023-09-01-preview' existing = {
  name: apimName
}

resource {apiName}Api 'Microsoft.ApiManagement/service/apis@2023-09-01-preview' existing = {
  parent: apimService
  name: '{api-name}'  // Must match the name in apis/{api-name}.bicep
}

// ============================================================================
// Operations
// ============================================================================

resource {operationName} 'Microsoft.ApiManagement/service/apis/operations@2023-09-01-preview' = {
  parent: {apiName}Api
  name: '{operationName}'  // camelCase identifier
  properties: {
    displayName: '{Human-Readable Operation Name}'
    method: 'GET'  // GET, POST, PUT, DELETE, PATCH
    urlTemplate: '/{path}'  // Relative to API path, can include {parameters}
    description: '''
{Detailed markdown description}

**Include:**
- What the operation does
- Required vs optional parameters
- Example use cases
'''
    request: {
      queryParameters: [
        {
          name: 'paramName'
          type: 'string'  // string, integer, boolean, number
          required: true
          description: 'Parameter description'
        }
      ]
      // For path parameters like /items/{id}:
      // templateParameters: [
      //   {
      //     name: 'id'
      //     type: 'string'
      //     required: true
      //     description: 'Item identifier'
      //   }
      // ]
    }
    responses: [
      {
        statusCode: 200
        description: 'Success response description'
        representations: [{ contentType: 'application/json' }]
      }
      {
        statusCode: 400
        description: 'Invalid input parameters'
      }
      {
        statusCode: 500
        description: 'Internal server error'
      }
    ]
  }
}
```

## Main Orchestrator Updates

Add module references to `infra/modules/api-management/api-management.bicep`:

### Add API Module

```bicep
// ============================================================================
// API Modules
// ============================================================================

module {apiName}Api 'apis/{api-name}.bicep' = {
  name: '{api-name}-deployment'
  dependsOn: [apim, product]
  params: {
    apimName: apimName
  }
}
```

### Add Operations Module

```bicep
// ============================================================================
// Operations Modules
// ============================================================================

module {apiName}Operations 'operations/{api-name}-operations.bicep' = {
  name: '{api-name}-operations-deployment'
  dependsOn: [{apiName}Api]
  params: {
    apimName: apimName
  }
}
```

## Product Association

To add an API to a product, update the product Bicep file:

```bicep
resource {apiName}ProductAssociation 'Microsoft.ApiManagement/service/products/apiLinks@2023-09-01-preview' = {
  parent: product
  name: '{api-name}-link'
  properties: {
    apiId: resourceId('Microsoft.ApiManagement/service/apis', apimName, '{api-name}')
  }
}
```

## Front Door Path Prefix

If using a new path prefix, update the main parameters file:

```bicep
param apiPathPrefixes = [
  '/existing-path'
  '/{new-path}'  // Add your new path prefix
]
```

## Validation Checklist

Before committing:

- [ ] `az bicep build --file infra/main.bicep` passes
- [ ] API name uses kebab-case
- [ ] Operation names use camelCase
- [ ] All parameters have descriptions
- [ ] `dependsOn` chains are correct:
  - API depends on `apim` and `product`
  - Operations depends on API
  - Policies (if separate) depend on API

## Common Policy Patterns

### Cache by Query Parameters

```xml
<cache-lookup vary-by-developer="false" vary-by-developer-groups="false" downstream-caching-type="public" caching-type="internal">
  <vary-by-query-parameter>language</vary-by-query-parameter>
  <vary-by-query-parameter>page</vary-by-query-parameter>
</cache-lookup>
```

### Backend API Key from Key Vault

If backend requires an API key, create a named value and reference it:

```xml
<set-header name="X-API-Key" exists-action="override">
  <value>{{backend-api-key}}</value>
</set-header>
```

### Transform Request Path

```xml
<rewrite-uri template="/api/v2{context.Request.Url.Path}" />
```
