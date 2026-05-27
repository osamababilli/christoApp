<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $customers = Customer::withCount('motors')
            ->when($request->search, fn($q, $s) => $q
                ->where('name', 'like', "%{$s}%")
                ->orWhere('phone', 'like', "%{$s}%")
            )
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('authenticated/customers', [
            'customers' => $customers->through(fn($c) => [
                'id'          => $c->id,
                'name'        => $c->name,
                'phone'       => $c->phone,
                'email'       => $c->email,
                'motors_count' => $c->motors_count,
                'created_at'  => $c->created_at->format('Y-m-d'),
            ]),
            'filters' => $request->only(['search']),
        ]);
    }
}
