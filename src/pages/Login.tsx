"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import i18n from '@/app/i18n'; // Import the i18n instance

const Login = () => {
  const { t } = useTranslation('loginPage');

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                    inputBackground: 'hsl(var(--input))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--ring))',
                    inputBorderFocus: 'hsl(var(--ring))',
                    inputText: 'hsl(var(--foreground))',
                    defaultButtonBackground: 'hsl(var(--primary))',
                    defaultButtonBackgroundHover: 'hsl(var(--primary-foreground))',
                    defaultButtonBorder: 'hsl(var(--primary))',
                    defaultButtonText: 'hsl(var(--primary-foreground))',
                    messageBackground: 'hsl(var(--background))',
                    messageText: 'hsl(var(--foreground))',
                    messageActionText: 'hsl(var(--primary))',
                    anchorTextColor: 'hsl(var(--primary))',
                    anchorTextHoverColor: 'hsl(var(--primary-foreground))',
                  },
                },
              },
            }}
            theme="light" // Using light theme, can be dynamic with next-themes if re-added
            i18n={i18n} // Pass the i18n instance here
            localization={{
              variables: {
                sign_in: {
                  email_label: t('emailLabel'),
                  password_label: t('passwordLabel'),
                  email_input_placeholder: t('emailPlaceholder'),
                  password_input_placeholder: t('passwordPlaceholder'),
                  button_label: t('signInButton'),
                  loading_button_label: t('signingInButton'),
                  link_text: t('signInLink'),
                },
                sign_up: {
                  email_label: t('emailLabel'),
                  password_label: t('passwordLabel'),
                  email_input_placeholder: t('emailPlaceholder'),
                  password_input_placeholder: t('passwordPlaceholder'),
                  button_label: t('signUpButton'),
                  loading_button_label: t('signingUpButton'),
                  link_text: t('signUpLink'),
                  form_fields: [
                    {
                      name: 'first_name',
                      label: t('firstNameLabel'),
                      placeholder: 'firstNamePlaceholder', // Use raw key
                      type: 'text',
                      required: false,
                    },
                    {
                      name: 'last_name',
                      label: t('lastNameLabel'),
                      placeholder: 'lastNamePlaceholder', // Use raw key
                      type: 'text',
                      required: false,
                    },
                  ],
                },
                forgotten_password: {
                  email_label: t('emailLabel'),
                  password_label: t('passwordLabel'),
                  email_input_placeholder: t('emailPlaceholder'),
                  button_label: t('sendResetPasswordButton'),
                  loading_button_label: t('sendingResetPasswordButton'),
                  link_text: t('forgotPasswordLink'),
                  confirmation_text: t('resetPasswordConfirmation'),
                },
                update_password: {
                  password_label: t('newPasswordLabel'),
                  password_input_placeholder: t('newPasswordPlaceholder'),
                  button_label: t('updatePasswordButton'),
                  loading_button_label: t('updatingPasswordButton'),
                },
                magic_link: {
                  email_input_placeholder: t('emailPlaceholder'),
                  button_label: t('sendMagicLinkButton'),
                  loading_button_label: t('sendingMagicLinkButton'),
                  link_text: t('magicLinkLink'),
                  confirmation_text: t('magicLinkConfirmation'),
                },
                verify_otp: {
                  email_input_placeholder: t('emailPlaceholder'),
                  phone_input_placeholder: t('phonePlaceholder'),
                  token_input_placeholder: t('tokenPlaceholder'),
                  button_label: t('verifyOtpButton'),
                  loading_button_label: t('verifyingOtpButton'),
                  link_text: t('verifyOtpLink'),
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;