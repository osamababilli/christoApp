<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\MotorController;
use App\Http\Controllers\PartController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\WorkshopDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Auth routes
Route::prefix('/')->group(function () {
    Route::get('/sign-in', fn() => Inertia::render('auth/sign-in'))->name('auth.sign-in');
    Route::get('/sign-up', fn() => Inertia::render('auth/sign-up'))->name('auth.sign-up');
    Route::get('/forgot-password', fn() => Inertia::render('auth/forgot-password'))->name('auth.forgot-password');
    Route::get('/otp', fn() => Inertia::render('auth/otp'))->name('auth.otp');
});

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

// Transactions (payments per motor)
Route::post('/motors/{motor}/transactions', [TransactionController::class, 'store'])->name('transactions.store');
Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy'])->name('transactions.destroy');

// Reports
Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

// Customers
Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
Route::get('/customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');

// Suppliers
Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
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
});

// Error pages
Route::prefix('errors')->name('error.')->group(function () {
    Route::get('forbidden', fn() => Inertia::render('errors/forbidden'))->name('forbidden');
    Route::get('unauthorized', fn() => Inertia::render('errors/unauthorized'))->name('unauthorized');
    Route::get('maintenance-error', fn() => Inertia::render('errors/maintenance'))->name('maintenance');
    Route::get('internal-server-error', fn() => Inertia::render('errors/internal-server'))->name('internal-server');
    Route::fallback(fn() => Inertia::render('errors/not-found'));
});
