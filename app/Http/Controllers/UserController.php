<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::select('id', 'name', 'email', 'phone', 'role', 'status', 'created_at')
            ->latest()
            ->get();

        return Inertia::render('authenticated/settings/users', [
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users'],
            'phone'    => ['nullable', 'string', 'max:30'],
            'role'     => ['required', Rule::in(['admin', 'manager', 'cashier'])],
            'status'   => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        User::create($data);

        return back()->with('success', 'تم إنشاء المستخدم بنجاح');
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone'    => ['nullable', 'string', 'max:30'],
            'role'     => ['required', Rule::in(['admin', 'manager', 'cashier'])],
            'status'   => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        if ($user->id === Auth::id() && ($data['role'] !== 'admin' || $data['status'] !== 'active')) {
            return back()->withErrors(['role' => 'لا يمكنك تخفيض صلاحياتك أو تعطيل حسابك بنفسك']);
        }

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        // Kick the user out of any open sessions once their access or credentials change
        if ($user->status !== 'active' || isset($data['password']) || $user->wasChanged('role')) {
            $this->invalidateSessions($user);
        }

        return back()->with('success', 'تم تحديث بيانات المستخدم');
    }

    public function destroy(User $user)
    {
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'لا يمكنك حذف حسابك الحالي']);
        }

        $this->invalidateSessions($user);
        $user->delete();

        return back()->with('success', 'تم حذف المستخدم');
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $rules = [
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
        ];

        if ($request->filled('password')) {
            $rules['current_password'] = ['required', 'current_password'];
            $rules['password']         = ['required', 'confirmed', Password::defaults()];
        }

        $data = $request->validate($rules);

        unset($data['current_password']);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return back()->with('success', 'تم تحديث الملف الشخصي بنجاح.');
    }

    private function invalidateSessions(User $user): void
    {
        if (config('session.driver') === 'database') {
            DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
        }
    }
}
