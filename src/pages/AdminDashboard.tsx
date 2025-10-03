"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useUpdateUserRole } from '@/hooks/useUpdateUserRole';
import { useUserRole } from '@/hooks/useUserRole';
import { formatDateTime } from '@/lib/scenario-utils';
import { showInfo } from '@/utils/toast';

const AdminDashboard = () => {
  const { t } = useTranslation(['adminDashboard', 'common']);
  const navigate = useNavigate();
  const { role: currentUserRole, isLoading: isCurrentUserRoleLoading } = useUserRole();
  const { data: users, isLoading: isUsersLoading, isError, error, refetch } = useAdminUsers();
  const { mutate: updateUserRole, isPending: isUpdatingRole } = useUpdateUserRole();

  if (isCurrentUserRoleLoading || isUsersLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="text-center py-8">{t('common:loading')}</CardContent>
      </Card>
    );
  }

  if (currentUserRole !== 'admin') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="text-center py-8 text-destructive">
          <CardDescription>{t('notAdminError')}</CardDescription>
          <Button onClick={() => navigate('/')} className="mt-4">{t('common:home')}</Button>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="text-center py-8 text-destructive">
          {t('fetchUsersError')} {error?.message}
        </CardContent>
      </Card>
    );
  }

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRole({ userId, newRole });
  };

  const availableRoles = ['free', 'premium', 'admin']; // Define available roles

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableHeaderEmail')}</TableHead>
                <TableHead>{t('tableHeaderFirstName')}</TableHead>
                <TableHead>{t('tableHeaderLastName')}</TableHead>
                <TableHead>{t('tableHeaderRole')}</TableHead>
                <TableHead>{t('tableHeaderCreatedAt')}</TableHead>
                <TableHead>{t('tableHeaderLastLogin')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email || t('common:none')}</TableCell>
                  <TableCell>{user.first_name || t('common:none')}</TableCell>
                  <TableCell>{user.last_name || t('common:none')}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                      disabled={isUpdatingRole}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('selectRole')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map(role => (
                          <SelectItem key={role} value={role}>
                            {t(`common:${role}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{formatDateTime(user.created_at)}</TableCell>
                  <TableCell>{user.last_login ? formatDateTime(user.last_login) : t('common:none')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button onClick={() => refetch()} className="mt-4" disabled={isUsersLoading || isUpdatingRole}>
          {t('refreshUsers')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;