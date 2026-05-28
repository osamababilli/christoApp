<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('authenticated/settings/categories', [
            'categories' => Category::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:255|unique:categories,name',
            'icon'  => 'nullable|string|max:100',
            'color' => 'nullable|string|max:100',
        ]);

        $category = Category::create($request->only('name', 'icon', 'color'));

        if ($request->expectsJson()) {
            return response()->json($category);
        }

        return back()->with('success', 'تم إضافة التصنيف');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $request->validate([
            'name'  => 'required|string|max:255|unique:categories,name,' . $category->id,
            'icon'  => 'nullable|string|max:100',
            'color' => 'nullable|string|max:100',
        ]);

        $category->update($request->only('name', 'icon', 'color'));

        return back()->with('success', 'تم تحديث التصنيف');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $category->delete();

        return back()->with('success', 'تم حذف التصنيف');
    }
}
