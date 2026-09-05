<?php

use App\Models\Customer;
use App\Models\Transaction;
use App\Models\User;

function userWith(string $role, string $status = 'active'): User
{
    return User::factory()->create(['role' => $role, 'status' => $status, 'password' => 'secret-pass-1']);
}

test('guests are redirected to sign in', function () {
    $this->get('/')->assertRedirect('/sign-in');
});

test('suspended users cannot sign in', function () {
    $user = userWith('cashier', 'suspended');

    $this->post('/login', ['email' => $user->email, 'password' => 'secret-pass-1'])
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('an active session is ended once the account is deactivated', function () {
    $user = userWith('cashier');

    $this->actingAs($user)->get('/')->assertOk();

    $user->update(['status' => 'inactive']);

    $this->actingAs($user)->get('/')->assertRedirect('/sign-in');
    $this->assertGuest();
});

test('cashiers cannot reach user management or the treasury', function () {
    $cashier = userWith('cashier');

    $this->actingAs($cashier)->get('/settings/users')->assertForbidden();
    $this->actingAs($cashier)->get('/accounting')->assertForbidden();
    $this->actingAs($cashier)->get('/employees')->assertForbidden();

    $customer = Customer::create(['name' => 'عميل', 'phone' => '70000009', 'account_type' => 'direct']);
    $tx = Transaction::create(['customer_id' => $customer->id, 'type' => 'payment', 'amount' => 10, 'transaction_date' => now()]);
    $this->actingAs($cashier)->delete("/transactions/{$tx->id}")->assertForbidden();
    expect(Transaction::count())->toBe(1);
});

test('managers reach the treasury but not user management', function () {
    $manager = userWith('manager');

    $this->actingAs($manager)->get('/accounting')->assertOk();
    $this->actingAs($manager)->get('/settings/users')->assertForbidden();
});

test('admins reach everything', function () {
    $admin = userWith('admin');

    $this->actingAs($admin)->get('/settings/users')->assertOk();
    $this->actingAs($admin)->get('/accounting')->assertOk();
});

test('login attempts are rate limited', function () {
    $user = userWith('cashier');

    foreach (range(1, 5) as $i) {
        $this->post('/login', ['email' => $user->email, 'password' => 'wrong']);
    }

    $this->post('/login', ['email' => $user->email, 'password' => 'wrong'])->assertStatus(429);
});

test('the password reset page is reachable from the emailed link', function () {
    $this->get('/reset-password/some-token?email=a@b.c')->assertOk();
});
