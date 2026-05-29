<?php
namespace App\Http\Controllers;

use App\Models\ShopDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ShopDocumentController extends Controller
{
    public function index(): Response
    {
        $documents = ShopDocument::latest()->get()->map(fn($d) => [
            'id'                   => $d->id,
            'name'                 => $d->name,
            'description'          => $d->description,
            'original_name'        => $d->original_name,
            'mime_type'            => $d->mime_type,
            'file_size_formatted'  => $d->file_size_formatted,
            'renewal_date'         => $d->renewal_date?->format('Y-m-d'),
            'reminder_days_before' => $d->reminder_days_before,
            'reminder_sent_at'     => $d->reminder_sent_at?->format('Y-m-d'),
            'status'               => $d->status,
            'days_remaining'       => $d->days_remaining,
            'created_at'           => $d->created_at->format('Y-m-d'),
        ]);

        $stats = [
            'total'    => $documents->count(),
            'expiring' => $documents->where('status', 'expiring')->count(),
            'expired'  => $documents->where('status', 'expired')->count(),
        ];

        return Inertia::render('authenticated/documents', [
            'documents' => $documents,
            'stats'     => $stats,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'                 => 'required|string|max:255',
            'description'          => 'nullable|string|max:1000',
            'file'                 => 'required|file|max:20480',
            'renewal_date'         => 'nullable|date',
            'reminder_days_before' => 'nullable|integer|min:1|max:365',
        ]);

        $file = $request->file('file');
        $path = $file->store('shop-documents', 'local');

        ShopDocument::create([
            'name'                 => $validated['name'],
            'description'          => $validated['description'] ?? null,
            'file_path'            => $path,
            'original_name'        => $file->getClientOriginalName(),
            'mime_type'            => $file->getMimeType(),
            'file_size'            => $file->getSize(),
            'renewal_date'         => $validated['renewal_date'] ?? null,
            'reminder_days_before' => $validated['reminder_days_before'] ?? 30,
        ]);

        return back()->with('success', 'تم رفع الوثيقة بنجاح');
    }

    public function download(ShopDocument $document): StreamedResponse
    {
        abort_unless(Storage::disk('local')->exists($document->file_path), 404);

        return Storage::disk('local')->download(
            $document->file_path,
            $document->original_name
        );
    }

    public function destroy(ShopDocument $document): RedirectResponse
    {
        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return back()->with('success', 'تم حذف الوثيقة');
    }
}
