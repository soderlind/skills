# PHP Unit Testing with Brain Monkey

Unit tests mock WordPress core functions and hooks with
[Brain Monkey](https://github.com/Brain-WP/BrainMonkey) so they run fast and
without a full WordPress install. Use this for pure PHP logic. For
integration-level tests that need a real database and WordPress runtime, use the
official WordPress test suite (`WP_UnitTestCase`) instead.

## Install

```sh
composer require --dev phpunit/phpunit brain/monkey
```

`brain/monkey` depends on `mockery/mockery` and `antecedent/patchwork`, which
Composer installs automatically. Do not pin versions — take the latest
compatible releases.

## phpunit.xml.dist

Create at project root:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit bootstrap="tests/bootstrap.php" colors="true">
  <testsuites>
    <testsuite name="unit">
      <directory suffix="Test.php">tests</directory>
    </testsuite>
  </testsuites>
</phpunit>
```

## tests/bootstrap.php

```php
<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/vendor/autoload.php';
```

## tests/TestCase.php

A shared base that wires Brain Monkey setup/teardown:

```php
<?php

declare(strict_types=1);

namespace Tests;

use Brain\Monkey;
use PHPUnit\Framework\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }
}
```

## Example test

Mock WordPress functions and assert hooks/filters without loading WordPress:

```php
<?php

declare(strict_types=1);

namespace Tests;

use Brain\Monkey\Functions;
use Brain\Monkey\Filters;

final class FormatTitleTest extends TestCase
{
    public function test_it_escapes_and_filters_the_title(): void
    {
        // Stub WordPress functions the code under test calls.
        Functions\when('esc_html')->returnArg();
        Functions\expect('sanitize_text_field')
            ->once()
            ->with(' Hello ')
            ->andReturn('Hello');

        $result = my_plugin_format_title(' Hello ');

        self::assertSame('Hello', $result);
        self::assertSame(1, Filters\applied('my_plugin_title'));
    }
}
```

Key Brain Monkey helpers:

- `Functions\when('fn')->justReturn($v)` / `->returnArg()` — light stubs.
- `Functions\expect('fn')->once()->with(...)->andReturn(...)` — assert calls.
- `Actions\expectAdded('hook')` / `Filters\expectApplied('hook')` — assert hooks.
- `Actions\has('hook', $cb)` — assert a callback was registered.

## Pest variant

If using Pest, call the same lifecycle in `tests/Pest.php`:

```php
<?php

use Brain\Monkey;

uses()
    ->beforeEach(fn () => Monkey\setUp())
    ->afterEach(fn () => Monkey\tearDown())
    ->in('Unit');
```

## Run

```sh
composer test        # phpunit
# or
./vendor/bin/pest
```
