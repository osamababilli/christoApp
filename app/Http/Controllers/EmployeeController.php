<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::latest()->get()->map(fn($e) => [
            'id'              => $e->id,
            'full_name'       => $e->full_name,
            'id_number'       => $e->id_number,
            'nationality'     => $e->nationality,
            'blood_type'      => $e->blood_type,
            'emergency_phone' => $e->emergency_phone,
            'id_image'        => $e->id_image ? Storage::url($e->id_image) : null,
            'created_at'      => $e->created_at->toISOString(),
        ]);

        return Inertia::render('authenticated/employees', [
            'employees' => $employees,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'full_name'       => ['required', 'string', 'max:255'],
            'id_number'       => ['required', 'string', 'max:50', 'unique:employees'],
            'nationality'     => ['required', 'string', 'max:100'],
            'blood_type'      => ['required', 'string', 'max:10'],
            'emergency_phone' => ['required', 'string', 'max:30'],
            'id_image'        => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('id_image')) {
            $data['id_image'] = $request->file('id_image')->store('employees', 'public');
        }

        Employee::create($data);

        return back()->with('success', 'تم إضافة الموظف بنجاح.');
    }

    public function update(Request $request, Employee $employee)
    {
        $data = $request->validate([
            'full_name'       => ['required', 'string', 'max:255'],
            'id_number'       => ['required', 'string', 'max:50', "unique:employees,id_number,{$employee->id}"],
            'nationality'     => ['required', 'string', 'max:100'],
            'blood_type'      => ['required', 'string', 'max:10'],
            'emergency_phone' => ['required', 'string', 'max:30'],
            'id_image'        => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('id_image')) {
            if ($employee->id_image) {
                Storage::disk('public')->delete($employee->id_image);
            }
            $data['id_image'] = $request->file('id_image')->store('employees', 'public');
        } else {
            unset($data['id_image']);
        }

        $employee->update($data);

        return back()->with('success', 'تم تحديث بيانات الموظف بنجاح.');
    }

    public function destroy(Employee $employee)
    {
        if ($employee->id_image) {
            Storage::disk('public')->delete($employee->id_image);
        }

        $employee->delete();

        return back()->with('success', 'تم حذف الموظف بنجاح.');
    }
}
