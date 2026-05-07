import AppLayout from '@/Layouts/AppLayout';
import React from "react";
import PageHeader from "../components/shared/PageHeader";
import BackupManagement from "../components/settings/BackupManagement";

export default function DatabaseBackup() {
  return (
    <div>
      <PageHeader
        title="Database Backup"
        description="Run and monitor backups, download history, and check backup status"
      />
      <BackupManagement />
    </div>
  );
}

DatabaseBackup.layout = (page) => <AppLayout currentPageName="DatabaseBackup">{page}</AppLayout>;
