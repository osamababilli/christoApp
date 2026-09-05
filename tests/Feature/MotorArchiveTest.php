<?php

use App\Models\AccountEntry;
use App\Models\Customer;
use App\Models\MaintenanceOrder;
use App\Models\Motor;
use App\Models\Part;
use App\Models\Transaction;
use App\Models\User;

function archiveAdmin(): User
{
    return User::factory()->create(['role' => 'admin', 'status' => 'active']);
}

function paidMotor(): Motor
{
    $customer = Customer::create(['name' => 'عميل', 'phone' => '70000200', 'account_type' => 'direct']);
    $motor    = Motor::create(['customer_id' => $customer->id, 'status' => 'in_workshop', 'received_at' => now()]);
    $order    = MaintenanceOrder::create(['motor_id' => $motor->id, 'stage' => 1, 'description' => 'عمل', 'labor_cost' => 100, 'status' => 'in_progress']);
    Part::create(['maintenance_id' => $order->id, 'part_name' => 'قطعة', 'quantity' => 1, 'unit_cost' => 10, 'purchased_by' => 'company', 'unit_price' => 20]);

    $tx = $motor->transactions()->create(['customer_id' => $customer->id, 'type' => 'payment', 'amount' => 50, 'transaction_date' => now()]);
    AccountEntry::create(['type' => 'income', 'amount' => 50, 'description' => 'دفعة', 'entry_date' => today(), 'transaction_id' => $tx->id]);

    return $motor;
}

test('archiving a motor takes its payments out of the treasury and customer totals', function () {
    $motor = paidMotor();
    $admin = archiveAdmin();

    expect(AccountEntry::sum('amount'))->toEqual(50);

    $this->actingAs($admin)->delete("/motors/{$motor->id}");

    expect(Transaction::count())->toBe(0);
    expect(AccountEntry::count())->toBe(0);
    expect(Motor::onlyTrashed()->count())->toBe(1);

    // and restoring brings the money back
    $this->actingAs($admin)->patch("/motors/{$motor->id}/restore");

    expect(Transaction::count())->toBe(1);
    expect(AccountEntry::sum('amount'))->toEqual(50);
});

test('an archived motor can be permanently deleted with everything tied to it', function () {
    $motor = paidMotor();
    $admin = archiveAdmin();

    $this->actingAs($admin)->delete("/motors/{$motor->id}");
    $this->actingAs($admin)->delete("/motors/{$motor->id}/force")->assertSessionHasNoErrors();

    expect(Motor::withTrashed()->count())->toBe(0);
    expect(MaintenanceOrder::withTrashed()->count())->toBe(0);
    expect(Part::withTrashed()->count())->toBe(0);
    expect(Transaction::withTrashed()->count())->toBe(0);
    expect(AccountEntry::withTrashed()->count())->toBe(0);
});

test('archived motors can be purged in bulk while live ones are left untouched', function () {
    $admin = archiveAdmin();
    $a = paidMotor();
    $b = Motor::create(['customer_id' => $a->customer_id, 'status' => 'in_workshop', 'received_at' => now()]);
    $c = Motor::create(['customer_id' => $a->customer_id, 'status' => 'in_workshop', 'received_at' => now()]);

    $this->actingAs($admin)->delete("/motors/{$a->id}");
    $this->actingAs($admin)->delete("/motors/{$b->id}");

    $this->actingAs($admin)
        ->delete('/motors-bulk/force', ['ids' => [$a->id, $b->id, $c->id]])
        ->assertSessionHasNoErrors();

    expect(Motor::withTrashed()->pluck('id')->all())->toBe([$c->id]);
    expect(Transaction::withTrashed()->count())->toBe(0);
    expect(AccountEntry::withTrashed()->count())->toBe(0);
});

test('a live motor cannot be purged and only admins may purge', function () {
    $motor   = paidMotor();
    $admin   = archiveAdmin();
    $manager = User::factory()->create(['role' => 'manager', 'status' => 'active']);

    $this->actingAs($admin)->delete("/motors/{$motor->id}/force")->assertNotFound();

    $this->actingAs($admin)->delete("/motors/{$motor->id}");
    $this->actingAs($manager)->delete("/motors/{$motor->id}/force")->assertForbidden();

    expect(Motor::withTrashed()->count())->toBe(1);
});
