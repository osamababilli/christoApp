<?php

namespace Database\Seeders;

use App\Models\AccountEntry;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\MaintenanceOrder;
use App\Models\Motor;
use App\Models\Part;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\SupplierPurchase;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Users ─────────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@workshop.com'],
            [
                'name'     => 'غسان متري',
                'password' => Hash::make('password'),
                'role'     => 'admin',
                'status'   => 'active',
                'phone'    => '0501234567',
            ]
        );

        $tech1 = User::firstOrCreate(
            ['email' => 'ahmad@workshop.com'],
            [
                'name'     => 'أحمد السالم',
                'password' => Hash::make('password'),
                'role'     => 'user',
                'status'   => 'active',
                'phone'    => '0551112233',
            ]
        );

        $tech2 = User::firstOrCreate(
            ['email' => 'khalid@workshop.com'],
            [
                'name'     => 'خالد العمري',
                'password' => Hash::make('password'),
                'role'     => 'user',
                'status'   => 'active',
                'phone'    => '0562223344',
            ]
        );

        // ── 2. Categories ─────────────────────────────────────────
        $this->call(CategorySeeder::class);

        $cats = Category::pluck('id', 'name');

        // ── 3. Employees ─────────────────────────────────────────
        $empData = [
            ['full_name' => 'محمد علي حسن',   'id_number' => '1082345671', 'nationality' => 'سعودي',   'blood_type' => 'O+',  'emergency_phone' => '0501111111'],
            ['full_name' => 'يوسف إبراهيم',    'id_number' => '1092345672', 'nationality' => 'يمني',    'blood_type' => 'A+',  'emergency_phone' => '0502222222'],
            ['full_name' => 'عبدالله الحربي',  'id_number' => '1102345673', 'nationality' => 'سعودي',   'blood_type' => 'B+',  'emergency_phone' => '0503333333'],
            ['full_name' => 'فهد الرشيدي',     'id_number' => '1112345674', 'nationality' => 'سعودي',   'blood_type' => 'AB-', 'emergency_phone' => '0504444444'],
        ];

        $employees = [];
        foreach ($empData as $d) {
            $employees[] = Employee::firstOrCreate(['id_number' => $d['id_number']], $d);
        }

        // ── 4. Customers ─────────────────────────────────────────
        $customerData = [
            ['name' => 'سعد العتيبي',     'phone' => '0501234001', 'account_type' => 'account', 'opening_balance' => 500.00],
            ['name' => 'منصور الغامدي',   'phone' => '0501234002', 'account_type' => 'account', 'opening_balance' => 0.00],
            ['name' => 'فيصل الدوسري',   'phone' => '0501234003', 'account_type' => 'direct',  'opening_balance' => 0.00],
            ['name' => 'عبدالرحمن الزهراني', 'phone' => '0501234004', 'account_type' => 'account', 'opening_balance' => 1200.00],
            ['name' => 'ناصر القحطاني',   'phone' => '0501234005', 'account_type' => 'direct',  'opening_balance' => 0.00],
            ['name' => 'حمد الشمري',      'phone' => '0501234006', 'account_type' => 'direct',  'opening_balance' => 0.00],
            ['name' => 'بدر العنزي',      'phone' => '0501234007', 'account_type' => 'account', 'opening_balance' => 200.00],
            ['name' => 'راشد المطيري',    'phone' => '0501234008', 'account_type' => 'direct',  'opening_balance' => 0.00],
            ['name' => 'جابر الحارثي',    'phone' => '0501234009', 'account_type' => 'account', 'opening_balance' => 0.00],
            ['name' => 'وليد السبيعي',    'phone' => '0501234010', 'account_type' => 'direct',  'opening_balance' => 0.00],
        ];

        $customers = [];
        foreach ($customerData as $d) {
            $customers[] = Customer::firstOrCreate(['phone' => $d['phone']], array_merge($d, [
                'email' => null,
                'notes' => null,
                'opening_balance_notes' => $d['opening_balance'] > 0 ? 'رصيد منقول من السجل السابق' : null,
            ]));
        }

        // ── 5. Suppliers ─────────────────────────────────────────
        $supplierData = [
            ['name' => 'مستودع الخليج للقطع',  'phone' => '0112345001', 'email' => 'gulf@parts.sa',   'notes' => 'مورد رئيسي لقطع المحركات'],
            ['name' => 'شركة النجمة للزيوت',    'phone' => '0112345002', 'email' => null,              'notes' => 'متخصص في الزيوت ومواد التشحيم'],
            ['name' => 'معرض الأمين للقطع',     'phone' => '0112345003', 'email' => 'ameen@shop.sa',   'notes' => null],
            ['name' => 'مركز السرعة للإلكترونيات', 'phone' => '0112345004', 'email' => null,           'notes' => 'قطع كهربائية وإلكترونية'],
            ['name' => 'الوطنية لقطع الغيار',   'phone' => '0112345005', 'email' => 'watania@gp.sa',   'notes' => 'توريد بالجملة'],
        ];

        $suppliers = [];
        foreach ($supplierData as $d) {
            $suppliers[] = Supplier::firstOrCreate(['phone' => $d['phone']], $d);
        }

        // ── 6. Motors + Maintenance + Parts + Transactions ────────
        $motorDefs = [
            // [customer_idx, category_name, status, days_ago_received]
            [0, 'موتور',  'delivered',    60],
            [0, 'موتور',  'delivered',    30],
            [0, 'سيارة',  'ready',         5],
            [1, 'غسالة',  'delivered',    45],
            [1, 'ثلاجة',  'in_progress',   3],
            [2, 'موتور',  'delivered',    90],
            [2, 'مكيف',   'in_workshop',   1],
            [3, 'سيارة',  'in_progress',   7],
            [3, 'موتور',  'delivered',    20],
            [3, 'ثلاجة',  'ready',        10],
            [4, 'موتور',  'delivered',    50],
            [4, 'غسالة',  'in_progress',   4],
            [5, 'سيارة',  'delivered',    15],
            [5, 'موتور',  'in_workshop',   2],
            [6, 'مكيف',   'delivered',    35],
            [6, 'ثلاجة',  'in_progress',   6],
            [7, 'موتور',  'delivered',    25],
            [7, 'سيارة',  'ready',         8],
            [8, 'موتور',  'in_workshop',   1],
            [9, 'غسالة',  'delivered',    40],
        ];

        $partTypes   = ['part', 'oil', 'transport', 'cleaning', 'other'];
        $partNames   = [
            'part'      => ['بيستون', 'بلبرينغ', 'صمام', 'كرنك', 'سير توقيت', 'فلتر هواء', 'فلتر وقود', 'برازيم', 'ماتور ستارت'],
            'oil'       => ['زيت محرك 5W30', 'زيت جير', 'زيت هيدروليك', 'شحمة فريز', 'زيت ناقل حركة'],
            'transport' => ['أجرة نقل', 'رسوم شحن'],
            'cleaning'  => ['منظف كاربوريتر', 'مواد تنظيف', 'إزالة صدأ'],
            'other'     => ['مواد لحام', 'أسلاك كهربائية', 'حشوات', 'براغي وصواميل'],
        ];

        $counter = 1;
        foreach ($motorDefs as $idx => $def) {
            [$custIdx, $catName, $status, $daysAgo] = $def;

            $receivedAt  = Carbon::now()->subDays($daysAgo)->setHour(rand(8, 14));
            $deliveredAt = in_array($status, ['delivered']) ? $receivedAt->copy()->addDays(rand(3, 14)) : null;

            $motor = Motor::create([
                'reference_number' => 'WS-' . str_pad($counter, 4, '0', STR_PAD_LEFT),
                'customer_id'      => $customers[$custIdx]->id,
                'category_id'      => $cats[$catName] ?? null,
                'status'           => $status,
                'notes'            => $idx % 3 === 0 ? 'يشكو العميل من صوت غريب وتسريب زيت' : ($idx % 3 === 1 ? 'توقف مفاجئ عن العمل' : null),
                'received_at'      => $receivedAt,
                'delivered_at'     => $deliveredAt,
                'assigned_to'      => rand(0, 1) ? $tech1->id : $tech2->id,
                'received_by'      => $employees[array_rand($employees)]->id,
            ]);
            $counter++;

            // Maintenance orders (1-2 per motor)
            $orderCount = ($status === 'in_workshop') ? 1 : rand(1, 2);
            $totalLaborCost = 0;
            $totalPartsCost = 0;

            for ($o = 0; $o < $orderCount; $o++) {
                $orderStatus = ($o === 0 && $status === 'in_workshop') ? 'in_progress'
                    : ($status === 'in_progress' && $o === $orderCount - 1 ? 'in_progress' : 'completed');

                $laborCost = rand(50, 300);
                $totalLaborCost += $laborCost;

                $maintenance = MaintenanceOrder::create([
                    'motor_id'     => $motor->id,
                    'stage'        => $o + 1,
                    'description'  => $o === 0
                        ? 'فحص شامل للمحرك وتحديد الأعطال'
                        : 'إصلاح الأعطال المكتشفة وتركيب القطع الجديدة',
                    'started_at'   => $receivedAt->copy()->addHours(rand(1, 4)),
                    'completed_at' => $orderStatus === 'completed'
                        ? $receivedAt->copy()->addDays(rand(1, 5))
                        : null,
                    'labor_cost'   => $laborCost,
                    'status'       => $orderStatus,
                ]);

                // Parts (1-3 per order)
                $partsCount = rand(1, 3);
                for ($p = 0; $p < $partsCount; $p++) {
                    $type      = $partTypes[array_rand($partTypes)];
                    $names     = $partNames[$type];
                    $partName  = $names[array_rand($names)];
                    $qty       = in_array($type, ['oil', 'cleaning']) ? rand(1, 4) : 1;
                    $unitCost  = rand(20, 400);
                    $byCompany = rand(0, 1);
                    $unitPrice = $byCompany ? round($unitCost * 1.20, 2) : $unitCost;
                    $supplier  = $suppliers[array_rand($suppliers)];

                    $part = new Part([
                        'maintenance_id' => $maintenance->id,
                        'part_name'      => $partName,
                        'supplier_id'    => $supplier->id,
                        'quantity'       => $qty,
                        'unit_cost'      => $unitCost,
                        'unit_price'     => $unitPrice,
                        'is_paid'        => (bool) rand(0, 1),
                        'type'           => $type,
                        'purchased_by'   => $byCompany ? 'company' : 'customer',
                    ]);
                    $part->save();
                    $totalPartsCost += (float) $part->total_cost;
                }
            }

            // Transactions (payments)
            $grandTotal = $totalLaborCost + $totalPartsCost;
            if ($grandTotal > 0 && $status !== 'in_workshop') {
                $paidRatio  = $status === 'delivered' ? rand(80, 100) / 100 : rand(30, 70) / 100;
                $paidAmount = round($grandTotal * $paidRatio, 2);

                Transaction::create([
                    'motor_id'         => $motor->id,
                    'customer_id'      => $customers[$custIdx]->id,
                    'type'             => 'payment',
                    'amount'           => $paidAmount,
                    'paid_amount'      => $paidAmount,
                    'remaining_amount' => round($grandTotal - $paidAmount, 2),
                    'transaction_date' => $deliveredAt ?? $receivedAt->copy()->addDays(rand(1, 3)),
                    'notes'            => $paidRatio >= 1.0 ? 'تم السداد كاملاً' : 'دفعة أولى',
                ]);

                AccountEntry::create([
                    'type'        => 'income',
                    'amount'      => $paidAmount,
                    'description' => "دفعة من العميل — {$customers[$custIdx]->name} | {$motor->reference_number}",
                    'entry_date'  => ($deliveredAt ?? $receivedAt->copy()->addDays(1))->toDateString(),
                ]);
            }
        }

        // ── 7. Supplier Purchases ─────────────────────────────────
        $purchaseItems = [
            ['part_name' => 'بيستونات كومبليت',   'part_type' => 'part',  'qty' => 4,  'price' => 85.00],
            ['part_name' => 'بلبرينغات محور',     'part_type' => 'part',  'qty' => 8,  'price' => 35.00],
            ['part_name' => 'زيت محرك 5W30 ليتر', 'part_type' => 'oil',   'qty' => 20, 'price' => 18.50],
            ['part_name' => 'فلاتر زيت',          'part_type' => 'part',  'qty' => 10, 'price' => 22.00],
            ['part_name' => 'أسلاك كهربائية متر', 'part_type' => 'other', 'qty' => 50, 'price' => 4.50],
            ['part_name' => 'حشوات سيليكون',      'part_type' => 'other', 'qty' => 15, 'price' => 12.00],
            ['part_name' => 'زيت جير جالون',      'part_type' => 'oil',   'qty' => 6,  'price' => 55.00],
            ['part_name' => 'صمامات دخول وخروج',  'part_type' => 'part',  'qty' => 12, 'price' => 45.00],
            ['part_name' => 'منظف كاربوريتر',     'part_type' => 'cleaning', 'qty' => 5, 'price' => 28.00],
            ['part_name' => 'أجرة شحن وتوصيل',   'part_type' => 'transport','qty' => 1, 'price' => 120.00],
        ];

        foreach ($suppliers as $si => $supplier) {
            $itemCount = rand(2, 4);
            $usedItems = array_slice($purchaseItems, ($si * 2) % count($purchaseItems), $itemCount);

            foreach ($usedItems as $item) {
                $date  = Carbon::now()->subDays(rand(5, 60));
                $total = $item['qty'] * $item['price'];

                SupplierPurchase::create([
                    'supplier_id'   => $supplier->id,
                    'part_name'     => $item['part_name'],
                    'part_type'     => $item['part_type'],
                    'quantity'      => $item['qty'],
                    'unit_cost'     => $item['price'],
                    'total_cost'    => $total,
                    'purchase_date' => $date->toDateString(),
                    'notes'         => null,
                ]);
            }
        }

        // ── 8. Supplier Payments ─────────────────────────────────
        foreach ($suppliers as $supplier) {
            $payCount = rand(1, 3);
            for ($p = 0; $p < $payCount; $p++) {
                $amount = rand(200, 1500);
                $date   = Carbon::now()->subDays(rand(1, 45));

                $entry = AccountEntry::create([
                    'type'        => 'expense',
                    'amount'      => $amount,
                    'description' => "دفعة للمورد — {$supplier->name}",
                    'entry_date'  => $date->toDateString(),
                ]);

                SupplierPayment::create([
                    'supplier_id'         => $supplier->id,
                    'amount'              => $amount,
                    'payment_date'        => $date->toDateString(),
                    'notes'               => "دفعة رقم " . ($p + 1),
                    'accounting_entry_id' => $entry->id,
                ]);
            }
        }

        // ── 9. Extra Accounting Entries (expenses & deposits) ────
        $expenses = [
            ['desc' => 'فاتورة كهرباء الورشة',    'amount' => 380,  'type' => 'expense'],
            ['desc' => 'إيجار الورشة شهر مايو',   'amount' => 2500, 'type' => 'expense'],
            ['desc' => 'مستلزمات تنظيف ورشة',     'amount' => 120,  'type' => 'expense'],
            ['desc' => 'صيانة معدات الورشة',       'amount' => 650,  'type' => 'expense'],
            ['desc' => 'فاتورة اتصالات',           'amount' => 95,   'type' => 'expense'],
            ['desc' => 'إيداع نقدي — رأس المال',  'amount' => 10000,'type' => 'deposit'],
            ['desc' => 'إيداع إضافي',              'amount' => 5000, 'type' => 'deposit'],
        ];

        foreach ($expenses as $i => $e) {
            AccountEntry::create([
                'type'        => $e['type'],
                'amount'      => $e['amount'],
                'description' => $e['desc'],
                'entry_date'  => Carbon::now()->subDays(rand(1, 30))->toDateString(),
            ]);
        }

        $this->command->info('✓ Demo data seeded successfully.');
        $this->command->info('  Admin login: admin@workshop.com / password');
    }
}
