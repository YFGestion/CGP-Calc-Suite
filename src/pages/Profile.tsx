"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser } from '@/hooks/useUser';
import { useUserRole } from '@/hooks/useUserRole';
import { formatDateTime } from '@/lib/scenario-utils'; // Reusing formatDateTime
import { Badge } from '@/components/ui/badge'; // Keep import for other uses if any, but remove from rendering here
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUpdateProfile } from '@/hooks/useUpdateProfile'; // Import the new hook

// Zod schema for form validation
const formSchema = (t: (key: string) => string) => z.object({
  firstName: z.string().max(50, t('validation.firstNameTooLong')).optional(),
  lastName: z.string().max(50, t('validation.lastNameTooLong')).optional(),
});

const ProfilePage = () => {
  const { t } = useTranslation('profilePage');
  const { t: commonT } = useTranslation('common');
  const { t: loginT } = useTranslation('loginPage'); // Import loginPage namespace for placeholders

  const { email, firstName, lastName, isLoading: isUserLoading, id: userId } = useUser();
  const { role, isPremium, isLoading: isRoleLoading } = useUserRole();
  const { user, isLoading: isSessionLoading } = useUser(); // To get created_at

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();

  const isLoading = isUserLoading || isRoleLoading || isSessionLoading;

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      firstName: firstName || '',
      lastName: lastName || '',
    },
    values: { // Ensure form values are updated when hook data changes
      firstName: firstName || '',
      lastName: lastName || '',
    },
  });

  const onSubmit = (values: z.infer<ReturnType<typeof formSchema>>) => {
    updateProfile({
      firstName: values.firstName,
      lastName: values.lastName,
    });
  };

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
            {/* Removed the Badge component here */}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">{t('registrationDate')} :</span>
          <span>{registrationDate}</span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('firstName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={loginT('firstNamePlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('lastName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={loginT('lastNamePlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isUpdatingProfile}>
              {isUpdatingProfile ? commonT('loading') : t('updateProfileButton')}
            </Button>
          </form>
        </CardContent>
    </Card>
  );
};

export default ProfilePage;