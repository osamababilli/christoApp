<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeeController extends Controller
{
    // ID documents are personal data: kept on the private disk and served only through an authorised route
    private const ID_IMAGE_DISK = 'local';

    public function index()
    {
        $employees = Employee::latest()->get()->map(fn($e) => [
            'id'                              => $e->id,
            'full_name'                       => $e->full_name,
            'id_number'                       => $e->id_number,
            'document_type'                   => $e->document_type,
            'nationality'                     => $e->nationality,
            'blood_type'                      => $e->blood_type,
            'emergency_phone'                 => $e->emergency_phone,
            'emergency_contact_name'          => $e->emergency_contact_name,
            'emergency_contact_relationship'  => $e->emergency_contact_relationship,
            'id_image'                        => $e->id_image ? route('employees.id-image', $e) . '?v=' . $e->updated_at?->timestamp : null,
            'salary_amount'                   => $e->salary_amount !== null ? (float) $e->salary_amount : null,
            'salary_period'                   => $e->salary_period,
            'created_at'                      => $e->created_at->toISOString(),
        ]);

        return Inertia::render('authenticated/employees', [
            'employees' => $employees,
        ]);
    }

    public function idImage(Employee $employee): StreamedResponse
    {
        abort_unless($employee->id_image && Storage::disk(self::ID_IMAGE_DISK)->exists($employee->id_image), 404);

        return Storage::disk(self::ID_IMAGE_DISK)->response($employee->id_image, null, [
            'Cache-Control' => 'private, max-age=300',
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());

        if ($request->hasFile('id_image')) {
            $data['id_image'] = $request->file('id_image')->store('employees', self::ID_IMAGE_DISK);
        }

        Employee::create($data);

        return back()->with('success', 'تم إضافة الموظف بنجاح.');
    }

    public function update(Request $request, Employee $employee)
    {
        $data = $request->validate($this->rules($employee));

        if ($request->hasFile('id_image')) {
            if ($employee->id_image) {
                Storage::disk(self::ID_IMAGE_DISK)->delete($employee->id_image);
            }
            $data['id_image'] = $request->file('id_image')->store('employees', self::ID_IMAGE_DISK);
        } else {
            unset($data['id_image']);
        }

        $employee->update($data);

        return back()->with('success', 'تم تحديث بيانات الموظف بنجاح.');
    }

    public function destroy(Employee $employee)
    {
        if ($employee->id_image) {
            Storage::disk(self::ID_IMAGE_DISK)->delete($employee->id_image);
        }

        $employee->delete();

        return back()->with('success', 'تم حذف الموظف بنجاح.');
    }

    private function rules(?Employee $employee = null): array
    {
        return [
            'full_name'                       => ['required', 'string', 'max:255'],
            'id_number'                       => ['required', 'string', 'max:50', Rule::unique('employees')->ignore($employee?->id)],
            'document_type'                   => ['required', 'string', Rule::in(Employee::DOCUMENT_TYPES)],
            'nationality'                     => ['required', 'string', 'max:100'],
            'blood_type'                      => ['required', 'string', 'max:10'],
            'emergency_phone'                 => ['required', 'string', 'max:30'],
            'emergency_contact_name'          => ['required', 'string', 'max:255'],
            'emergency_contact_relationship'  => ['required', 'string', 'max:100'],
            'id_image'                        => ['nullable', 'image', 'max:5120'],
            'salary_amount'                   => ['nullable', 'numeric', 'min:0'],
            'salary_period'                   => ['nullable', 'required_with:salary_amount', 'string', Rule::in(Employee::SALARY_PERIODS)],
        ];
    }
}
