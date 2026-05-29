<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\MotorController;
use App\Http\Controllers\PartController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\AccountingController;
use App\Http\Controllers\ShopDocumentController;
use App\Http\Controllers\WorkshopDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Guest-only auth routes
Route::middleware('guest')->group(function () {
    Route::get('/sign-in', fn() => Inertia::render('auth/sign-in'))->name('auth.sign-in');
    Route::get('/sign-up', fn() => Inertia::render('auth/sign-up'))->name('auth.sign-up');
    Route::get('/forgot-password', fn() => Inertia::render('auth/forgot-password'))->name('auth.forgot-password');
    Route::get('/otp', fn() => Inertia::render('auth/otp'))->name('auth.otp');

    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
    Route::post('/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink'])->name('password.email');
});

// Logout (auth required)
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('auth.logout');

// Authenticated routes
Route::middleware('auth')->group(function () {
    // Workshop Dashboard
    Route::get('/', [WorkshopDashboardController::class, 'index'])->name('dashboard');

    // Motors
    Route::resource('motors', MotorController::class);
    Route::get('motors/{motor}/print', [MotorController::class, 'printView'])->name('motors.print');
    Route::get('motors/{motor}/print/delivery', [MotorController::class, 'printDelivery'])->name('motors.print-delivery');
    Route::patch('motors/{motor}/status', [MotorController::class, 'updateStatus'])->name('motors.update-status');
    Route::delete('motors-bulk', [MotorController::class, 'bulkDestroy'])->name('motors.bulk-destroy');

    // Maintenance
    Route::get('/maintenance', [MaintenanceController::class, 'index'])->name('maintenance.index');
    Route::post('/maintenance', [MaintenanceController::class, 'store'])->name('maintenance.store');
    Route::put('/maintenance/{maintenance}', [MaintenanceController::class, 'update'])->name('maintenance.update');
    Route::patch('/maintenance/{maintenance}/status', [MaintenanceController::class, 'updateStatus'])->name('maintenance.update-status');
    Route::delete('/maintenance/{maintenance}', [MaintenanceController::class, 'destroy'])->name('maintenance.destroy');

    // Parts
    Route::get('/parts', [PartController::class, 'index'])->name('parts.index');
    Route::post('/parts', [PartController::class, 'store'])->name('parts.store');
    Route::put('/parts/{part}', [PartController::class, 'update'])->name('parts.update');
    Route::delete('/parts/{part}', [PartController::class, 'destroy'])->name('parts.destroy');

    // Transactions
    Route::post('/motors/{motor}/transactions', [TransactionController::class, 'store'])->name('transactions.store');
    Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy'])->name('transactions.destroy');

    // Shop Documents
    Route::get('/documents', [ShopDocumentController::class, 'index'])->name('documents.index');
    Route::post('/documents', [ShopDocumentController::class, 'store'])->name('documents.store');
    Route::get('/documents/{document}/download', [ShopDocumentController::class, 'download'])->name('documents.download');
    Route::delete('/documents/{document}', [ShopDocumentController::class, 'destroy'])->name('documents.destroy');

    // Accounting
    Route::get('/accounting', [AccountingController::class, 'index'])->name('accounting.index');
    Route::post('/accounting', [AccountingController::class, 'store'])->name('accounting.store');
    Route::delete('/accounting/{accounting}', [AccountingController::class, 'destroy'])->name('accounting.destroy');
    Route::get('/accounting/print', [AccountingController::class, 'printStatement'])->name('accounting.print');

    // Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

    // Customers
    Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
    Route::put('/customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
    Route::get('/customers/{customer}/statement', [CustomerController::class, 'statement'])->name('customers.statement');
    Route::patch('/customers/{customer}/type', [CustomerController::class, 'updateType'])->name('customers.update-type');
    Route::post('/customers/{customer}/transactions', [CustomerController::class, 'storeTransaction'])->name('customers.transactions.store');
    Route::get('/customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');

    // Employees
    Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::post('/employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');

    // Suppliers
    Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
    Route::get('/suppliers/{supplier}', [SupplierController::class, 'show'])->name('suppliers.show');
    Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
    Route::put('/suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');

    // Settings
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', fn() => Inertia::render('authenticated/settings'))->name('index');
        Route::get('/profile', fn() => Inertia::render('authenticated/settings/profile'))->name('profile');
        Route::get('/account', fn() => Inertia::render('authenticated/settings/account'))->name('account');
        Route::get('/appearance', fn() => Inertia::render('authenticated/settings/appearance'))->name('appearance');
        Route::get('/notifications', fn() => Inertia::render('authenticated/settings/notifications'))->name('notifications');
        Route::get('/display', fn() => Inertia::render('authenticated/settings/display'))->name('display');

        // Users management
        Route::get('/users', [UserController::class, 'index'])->name('users');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        // Categories management
        Route::get('/categories', [CategoryController::class, 'index'])->name('categories');
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::put('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
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
