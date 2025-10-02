"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser } from '@/hooks/useUser';
import { useUserRole } from '@/hooks/useUserRole';
import { formatDateTime } from '@/lib/scenario-utils'; // Reusing formatDateTime
import { Badge } from '@/components/ui/badge';

const ProfilePage = () => {
  const { t } = useTranslation('profilePage');
  const { t: commonT } = useTranslation('common');
  const { email, isLoading: isUserLoading } = useUser();
  const { role, isPremium, isLoading: isRoleLoading } = useUserRole();
  const { user, isLoading: isSessionLoading } = useUser(); // To get created_at

  const isLoading = isUserLoading || isRoleLoading || isSessionLoading;

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="text-center py-8">{commonT('loading')}</CardContent>
      </Card>
    );
  }

  if (!email) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
        <CardContent className="text-center py-8">
          <CardDescription>{t('notAuthenticated')}</CardDescription>
        </CardContent>
      </Card>
    );
  }

  const registrationDate = user?.created_at ? formatDateTime(user.created_at) : commonT('none');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">{t('email')} :</span>
          <span>{email}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">{t('role')} :</span>
          <span className="flex items-center">
            {role ? commonT(role) : commonT('free')}
            {isPremium && <Badge variant="secondary" className="ml-2 bg-yellow-500 text-white">{commonT('premium')}</Badge>}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">{t('registrationDate')} :</span>
          <span>{registrationDate}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfilePage;