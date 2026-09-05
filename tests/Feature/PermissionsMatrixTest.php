<?php

use App\Models\Customer;
use App\Models\Transaction;
use App\Models\User;
use App\Support\Permissions;
use Inertia\Testing\AssertableInertia;

function roleUser(string $role): User
{
    return User::factory()->create(['role' => $role, 'status' => 'active']);
}

test('every ability is granted to admins', function () {
    foreach (array_keys(Permissions::MATRIX) as $ability) {
        expect(Permissions::allows($ability, 'admin'))->toBeTrue($ability);
    }
});

test('the shared can map matches the matrix for each role', function () {
    foreach (Permissions::ROLES as $role) {
        $this->actingAs(roleUser($role))
            ->get('/settings')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('auth.can', Permissions::forRole($role)));
    }
});

test('cashiers can operate the workshop but cannot delete or see money', function () {
    $cashier  = roleUser('cashier');
    $customer = Customer::create(['name' => 'ع', 'phone' => '70000100', 'account_type' => 'direct']);

    $this->actingAs($cashier)->get('/motors')->assertOk();
    $this->actingAs($cashier)->get('/customers')->assertOk();
    $this->actingAs($cashier)->get('/invoices')->assertOk();
    $this->actingAs($cashier)->get('/suppliers')->assertOk();
    $this->actingAs($cashier)->get('/documents')->assertOk();

    $this->actingAs($cashier)->get('/accounting')->assertForbidden();
    $this->actingAs($cashier)->get('/reports')->assertForbidden();
    $this->actingAs($cashier)->get('/employees')->assertForbidden();
    $this->actingAs($cashier)->delete("/customers/{$customer->id}")->assertForbidden();

    $tx = Transaction::create(['customer_id' => $customer->id, 'type' => 'payment', 'amount' => 5, 'transaction_date' => now()]);
    $this->actingAs($cashier)->delete("/transactions/{$tx->id}")->assertForbidden();
    expect(Transaction::count())->toBe(1);
});

test('managers can delete and see money but cannot administer the system', function () {
    $manager = roleUser('manager');

    $this->actingAs($manager)->get('/accounting')->assertOk();
    $this->actingAs($manager)->get('/reports')->assertOk();
    $this->actingAs($manager)->get('/employees')->assertOk();

    $this->actingAs($manager)->get('/settings/users')->assertForbidden();
    $this->actingAs($manager)->get('/settings/categories')->assertForbidden();
});

test('admins administer users and categories', function () {
    $admin = roleUser('admin');

    $this->actingAs($admin)->get('/settings/users')->assertOk();
    $this->actingAs($admin)->get('/settings/categories')->assertOk();
});
