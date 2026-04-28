<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\StudentsImport;
use App\Services\StudentEnrollmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class StudentImportController extends Controller
{
    public function __construct(private readonly StudentEnrollmentService $service)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:10240'],
        ]);

        $importer = new StudentsImport($this->service, $request->user()?->id);
        Excel::import($importer, $request->file('file'));

        return response()->json([
            'data' => [
                'created' => $importer->created,
                'updated' => $importer->updated,
                'errors' => $importer->errors,
            ],
        ]);
    }
}
