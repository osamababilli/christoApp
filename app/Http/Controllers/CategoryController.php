<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
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
}
