<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\MotorController;
use App\Http\Controllers\PartController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\AccountingController;
use App\Http\Controllers\ShopDocumentController;
use App\Http\Controllers\StatementController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\WorkshopDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
 | Abilities used below are defined in App\Support\Permissions::MATRIX
 | (admin / manager / cashier). The frontend receives the same map as `auth.can`.
 */

// Guest-only auth routes
Route::middleware('guest')->group(function () {
    Route::get('/sign-in', fn() => Inertia::render('auth/sign-in'))->name('auth.sign-in');
    Route::get('/forgot-password', fn() => Inertia::render('auth/forgot-password'))->name('auth.forgot-password');
    Route::get('/reset-password/{token}', [ResetPasswordController::class, 'create'])->name('password.reset');

    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1')->name('auth.login');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink'])->middleware('throttle:3,10')->name('password.email');
    Route::post('/reset-password', [ResetPasswordController::class, 'store'])->middleware('throttle:5,1')->name('password.update');
});

Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('auth.logout');

Route::middleware(['auth', 'active'])->group(function () {

    Route::get('/', [WorkshopDashboardController::class, 'index'])->middleware('can:view-dashboard')->name('dashboard');

    // ── Motors ──
    Route::middleware('can:manage-motors')->group(function () {
        Route::get('motors', [MotorController::class, 'index'])->name('motors.index');
        Route::get('motors/create', [MotorController::class, 'create'])->name('motors.create');
        Route::post('motors', [MotorController::class, 'store'])->name('motors.store');
        Route::get('motors/{motor}', [MotorController::class, 'show'])->name('motors.show');
        Route::get('motors/{motor}/edit', [MotorController::class, 'edit'])->name('motors.edit');
        Route::match(['put', 'patch'], 'motors/{motor}', [MotorController::class, 'update'])->name('motors.update');
        Route::get('motors/{motor}/print', [MotorController::class, 'printView'])->name('motors.print');
        Route::get('motors/{motor}/print/delivery', [MotorController::class, 'printDelivery'])->name('motors.print-delivery');
        Route::patch('motors/{motor}/status', [MotorController::class, 'updateStatus'])->name('motors.update-status');
    });
    Route::middleware('can:archive-motors')->group(function () {
        Route::delete('motors/{motor}', [MotorController::class, 'destroy'])->name('motors.destroy');
        Route::patch('motors/{id}/restore', [MotorController::class, 'restore'])->name('motors.restore');
        Route::delete('motors-bulk', [MotorController::class, 'bulkDestroy'])->name('motors.bulk-destroy');
    });
    Route::middleware('can:purge-motors')->group(function () {
        Route::delete('motors-bulk/force', [MotorController::class, 'bulkForceDestroy'])->name('motors.bulk-force-destroy');
        Route::delete('motors/{id}/force', [MotorController::class, 'forceDestroy'])->name('motors.force-destroy');
    });

    // ── Maintenance ──
    Route::middleware('can:manage-maintenance')->group(function () {
        Route::get('/maintenance', [MaintenanceController::class, 'index'])->name('maintenance.index');
        Route::post('/maintenance', [MaintenanceController::class, 'store'])->name('maintenance.store');
        Route::put('/maintenance/{maintenance}', [MaintenanceController::class, 'update'])->name('maintenance.update');
        Route::patch('/maintenance/{maintenance}/status', [MaintenanceController::class, 'updateStatus'])->name('maintenance.update-status');
    });
    Route::delete('/maintenance/{maintenance}', [MaintenanceController::class, 'destroy'])->middleware('can:delete-maintenance')->name('maintenance.destroy');

    // ── Parts ──
    Route::middleware('can:manage-parts')->group(function () {
        Route::get('/parts', [PartController::class, 'index'])->name('parts.index');
        Route::post('/parts', [PartController::class, 'store'])->name('parts.store');
        Route::put('/parts/{part}', [PartController::class, 'update'])->name('parts.update');
        Route::post('/shop-purchases', [PartController::class, 'storeShopPurchase'])->name('shop-purchases.store');
    });
    Route::delete('/parts/{part}', [PartController::class, 'destroy'])->middleware('can:delete-parts')->name('parts.destroy');

    // ── Payments ──
    Route::post('/motors/{motor}/transactions', [TransactionController::class, 'store'])->middleware('can:record-payments')->name('transactions.store');
    Route::post('/statement/{customer}/pay', [StatementController::class, 'pay'])->middleware('can:record-payments')->name('statement.pay');
    Route::post('/customers/{customer}/transactions', [CustomerController::class, 'storeTransaction'])->middleware('can:record-payments')->name('customers.transactions.store');
    Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy'])->middleware('can:delete-payments')->name('transactions.destroy');

    // ── Documents ──
    Route::middleware('can:manage-documents')->group(function () {
        Route::get('/documents', [ShopDocumentController::class, 'index'])->name('documents.index');
        Route::post('/documents', [ShopDocumentController::class, 'store'])->name('documents.store');
        Route::get('/documents/{document}/download', [ShopDocumentController::class, 'download'])->name('documents.download');
    });
    Route::delete('/documents/{document}', [ShopDocumentController::class, 'destroy'])->middleware('can:delete-documents')->name('documents.destroy');

    // ── Invoices & statement ──
    Route::middleware('can:manage-invoices')->group(function () {
        Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
        Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
        Route::put('/invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
        Route::get('/statement', [StatementController::class, 'index'])->name('statement.index');
    });
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->middleware('can:delete-invoices')->name('invoices.destroy');

    // ── Customers ──
    Route::middleware('can:manage-customers')->group(function () {
        Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
        Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
        Route::put('/customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
        Route::get('/customers/{customer}/statement', [CustomerController::class, 'statement'])->name('customers.statement');
        Route::patch('/customers/{customer}/type', [CustomerController::class, 'updateType'])->name('customers.update-type');
        Route::get('/customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
    });
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])->middleware('can:delete-customers')->name('customers.destroy');

    // ── Quotations ──
    Route::middleware('can:manage-quotations')->group(function () {
        Route::get('/quotations', [QuotationController::class, 'index'])->name('quotations.index');
        Route::get('/quotations/create', [QuotationController::class, 'create'])->name('quotations.create');
        Route::post('/quotations', [QuotationController::class, 'store'])->name('quotations.store');
        Route::get('/quotations/{quotation}', [QuotationController::class, 'show'])->name('quotations.show');
        Route::get('/quotations/{quotation}/edit', [QuotationController::class, 'edit'])->name('quotations.edit');
        Route::put('/quotations/{quotation}', [QuotationController::class, 'update'])->name('quotations.update');
        Route::patch('/quotations/{quotation}/status', [QuotationController::class, 'updateStatus'])->name('quotations.update-status');
        Route::get('/quotations/{quotation}/print', [QuotationController::class, 'print'])->name('quotations.print');
    });
    Route::post('/quotations/{quotation}/convert', [QuotationController::class, 'convert'])->middleware('can:convert-quotations')->name('quotations.convert');
    Route::delete('/quotations/{quotation}', [QuotationController::class, 'destroy'])->middleware('can:delete-quotations')->name('quotations.destroy');

    // ── Suppliers ──
    Route::middleware('can:manage-suppliers')->group(function () {
        Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
        Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
        Route::put('/suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
        Route::post('/suppliers/{supplier}/purchases', [SupplierController::class, 'storePurchase'])->name('suppliers.purchases.store');
        Route::post('/suppliers/{supplier}/payments', [SupplierController::class, 'storePayment'])->name('suppliers.payments.store');
        Route::get('/suppliers/{supplier}', [SupplierController::class, 'show'])->name('suppliers.show');
    });
    Route::middleware('can:delete-suppliers')->group(function () {
        Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');
        Route::delete('/supplier-purchases/{purchase}', [SupplierController::class, 'destroyPurchase'])->name('suppliers.purchases.destroy');
        Route::delete('/supplier-payments/{payment}', [SupplierController::class, 'destroyPayment'])->name('suppliers.payments.destroy');
    });

    // ── Treasury & reports ──
    Route::middleware('can:view-accounting')->group(function () {
        Route::get('/accounting', [AccountingController::class, 'index'])->name('accounting.index');
        Route::get('/accounting/print', [AccountingController::class, 'printStatement'])->name('accounting.print');
    });
    Route::middleware('can:manage-accounting')->group(function () {
        Route::post('/accounting', [AccountingController::class, 'store'])->name('accounting.store');
        Route::delete('/accounting/{accounting}', [AccountingController::class, 'destroy'])->name('accounting.destroy');
    });
    Route::get('/reports', [ReportController::class, 'index'])->middleware('can:view-reports')->name('reports.index');

    // ── Employees ──
    Route::middleware('can:manage-employees')->group(function () {
        Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
        Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
        Route::post('/employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
        Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
        Route::get('/employees/{employee}/id-image', [EmployeeController::class, 'idImage'])->name('employees.id-image');
    });

    // ── Own profile ──
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', fn() => Inertia::render('authenticated/settings'))->name('index');
        Route::get('/profile', fn() => Inertia::render('authenticated/settings/profile'))->name('profile');
        Route::get('/account', fn() => Inertia::render('authenticated/settings/account'))->name('account');
        Route::get('/appearance', fn() => Inertia::render('authenticated/settings/appearance'))->name('appearance');
        Route::put('/profile', [UserController::class, 'updateProfile'])->name('profile.update');
    });

    // ── Administration ──
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::middleware('can:manage-users')->group(function () {
            Route::get('/users', [UserController::class, 'index'])->name('users');
            Route::post('/users', [UserController::class, 'store'])->name('users.store');
            Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
            Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        });
        Route::middleware('can:manage-categories')->group(function () {
            Route::get('/categories', [CategoryController::class, 'index'])->name('categories');
            Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
            Route::put('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
            Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
        });
    });
});

// Error pages (no middleware)
Route::prefix('errors')->name('error.')->group(function () {
    Route::get('forbidden', fn() => Inertia::render('errors/forbidden'))->name('forbidden');
    Route::get('unauthorized', fn() => Inertia::render('errors/unauthorized'))->name('unauthorized');
    Route::get('maintenance-error', fn() => Inertia::render('errors/maintenance'))->name('maintenance');
    Route::get('internal-server-error', fn() => Inertia::render('errors/internal-server'))->name('internal-server');
    Route::fallback(fn() => Inertia::render('errors/not-found'));
});
