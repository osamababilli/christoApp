<?php

namespace App\Support;

/**
 * Single source of truth for what each role may do.
 * Every ability below is registered as a Gate and shared with the frontend as `auth.can`.
 */
final class Permissions
{
    public const ROLES = ['admin', 'manager', 'cashier'];

    private const ALL     = ['admin', 'manager', 'cashier'];
    private const MANAGER = ['admin', 'manager'];
    private const ADMIN   = ['admin'];

    /** @var array<string, list<string>> ability => roles allowed */
    public const MATRIX = [
        // Day-to-day workshop operations — every signed-in user
        'view-dashboard'      => self::ALL,
        'manage-motors'       => self::ALL,   // create / edit / change status / print
        'manage-maintenance'  => self::ALL,
        'manage-parts'        => self::ALL,
        'manage-customers'    => self::ALL,
        'manage-quotations'   => self::ALL,
        'manage-suppliers'    => self::ALL,   // add suppliers, purchases, and supplier payments
        'manage-invoices'     => self::ALL,
        'record-payments'     => self::ALL,
        'manage-documents'    => self::ALL,

        // Anything that removes or rewrites history — manager and above
        'archive-motors'      => self::MANAGER, // archive / restore / bulk archive
        'delete-maintenance'  => self::MANAGER,
        'delete-parts'        => self::MANAGER,
        'delete-customers'    => self::MANAGER,
        'delete-quotations'   => self::MANAGER,
        'delete-suppliers'    => self::MANAGER, // supplier, purchases, supplier payments
        'delete-invoices'     => self::MANAGER,
        'delete-payments'     => self::MANAGER,
        'delete-documents'    => self::MANAGER,
        'convert-quotations'  => self::MANAGER,

        // Money and people — manager and above
        'view-accounting'     => self::MANAGER,
        'manage-accounting'   => self::MANAGER,
        'view-reports'        => self::MANAGER,
        'manage-employees'    => self::MANAGER,

        // System administration — admin only
        'purge-motors'        => self::ADMIN,   // permanently delete an archived job and everything tied to it
        'manage-users'        => self::ADMIN,
        'manage-categories'   => self::ADMIN,
    ];

    public static function allows(string $ability, ?string $role): bool
    {
        return $role !== null && in_array($role, self::MATRIX[$ability] ?? [], true);
    }

    /** @return array<string, bool> */
    public static function forRole(?string $role): array
    {
        $out = [];
        foreach (self::MATRIX as $ability => $roles) {
            $out[$ability] = $role !== null && in_array($role, $roles, true);
        }

        return $out;
    }
}
