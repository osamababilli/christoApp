<?php

use App\Models\AccountEntry;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\MaintenanceOrder;
use App\Models\Motor;
use App\Models\Part;
use App\Models\Transaction;
use App\Models\User;

function admin(): User
{
    return User::factory()->create(['role' => 'admin', 'status' => 'active']);
}

function directCustomer(): Customer
{
    return Customer::create(['name' => 'عميل', 'phone' => '70000001', 'account_type' => 'direct']);
}

function motorWithLabor(Customer $customer, float $labor = 100): Motor
{
    $motor = Motor::create(['customer_id' => $customer->id, 'status' => 'in_workshop', 'received_at' => now()]);
    MaintenanceOrder::create(['motor_id' => $motor->id, 'stage' => 1, 'description' => 'عمل', 'labor_cost' => $labor, 'status' => 'in_progress']);

    return $motor;
}

test('a motor payment creates a matching treasury entry', function () {
    $motor = motorWithLabor(directCustomer());

    $this->actingAs(admin())
        ->post("/motors/{$motor->id}/transactions", ['type' => 'payment', 'amount' => 40, 'payment_method' => 'cash'])
        ->assertSessionHasNoErrors();

    $tx = Transaction::sole();
    expect((float) $tx->amount)->toBe(40.0);
    expect(AccountEntry::where('transaction_id', $tx->id)->where('type', 'income')->sum('amount'))->toEqual(40);
});

test('deleting a payment removes its treasury entry', function () {
    $motor = motorWithLabor(directCustomer());
    $user  = admin();

    $this->actingAs($user)->post("/motors/{$motor->id}/transactions", ['type' => 'payment', 'amount' => 40]);
    $tx = Transaction::sole();

    $this->actingAs($user)->delete("/transactions/{$tx->id}")->assertSessionHasNoErrors();

    expect(Transaction::count())->toBe(0);
    expect(AccountEntry::count())->toBe(0);
});

test('a payment larger than the remaining balance is rejected', function () {
    $motor = motorWithLabor(directCustomer(), 100);

    $this->actingAs(admin())
        ->post("/motors/{$motor->id}/transactions", ['type' => 'payment', 'amount' => 150])
        ->assertSessionHasErrors('amount');

    expect(Transaction::count())->toBe(0);
    expect(AccountEntry::count())->toBe(0);
});

test('invoice allocations cannot exceed what the invoice still owes', function () {
    $customer = directCustomer();
    $invoice  = Invoice::create(['customer_id' => $customer->id, 'description' => 'فاتورة', 'amount' => 100, 'issued_date' => today()]);

    $this->actingAs(admin())->post("/statement/{$customer->id}/pay", [
        'mode'           => 'per_invoice',
        'payment_method' => 'cash',
        'allocations'    => [
            ['invoice_id' => $invoice->id, 'amount' => 60],
            ['invoice_id' => $invoice->id, 'amount' => 60],
        ],
    ])->assertSessionHasErrors('allocations');

    expect(Transaction::count())->toBe(0);
});

test('a delivered and fully paid motor is locked against edits', function () {
    $motor = motorWithLabor(directCustomer(), 100);
    $user  = admin();

    $this->actingAs($user)->post("/motors/{$motor->id}/transactions", ['type' => 'payment', 'amount' => 100]);
    $this->actingAs($user)->patch("/motors/{$motor->id}/status", ['status' => 'delivered']);

    expect($motor->fresh()->isLocked())->toBeTrue();

    $this->actingAs($user)
        ->patch("/motors/{$motor->id}/status", ['status' => 'in_workshop'])
        ->assertSessionHas('error');

    expect($motor->fresh()->status)->toBe('delivered');
});

test('restoring an archived motor brings its maintenance orders and parts back', function () {
    $motor = motorWithLabor(directCustomer());
    $order = $motor->maintenanceOrders()->first();
    Part::create(['maintenance_id' => $order->id, 'part_name' => 'قطعة', 'quantity' => 1, 'unit_cost' => 10, 'purchased_by' => 'company', 'unit_price' => 15]);

    $user = admin();
    $this->actingAs($user)->delete("/motors/{$motor->id}");

    expect(Motor::count())->toBe(0);
    expect(MaintenanceOrder::count())->toBe(0);
    expect(Part::count())->toBe(0);

    $this->actingAs($user)->patch("/motors/{$motor->id}/restore")->assertSessionHasNoErrors();

    expect(Motor::count())->toBe(1);
    expect(MaintenanceOrder::count())->toBe(1);
    expect(Part::count())->toBe(1);
});

test('treasury entries generated from a payment cannot be deleted directly', function () {
    $motor = motorWithLabor(directCustomer());
    $user  = admin();

    $this->actingAs($user)->post("/motors/{$motor->id}/transactions", ['type' => 'payment', 'amount' => 40]);
    $entry = AccountEntry::sole();

    $this->actingAs($user)->delete("/accounting/{$entry->id}")->assertSessionHas('error');

    expect(AccountEntry::count())->toBe(1);
});
