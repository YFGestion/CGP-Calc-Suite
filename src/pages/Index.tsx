"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calculator,
  LandPlot,
  PiggyBank,
  Wallet,
  LayoutGrid,
} from 'lucide-react';

const Index = () => {
  const { t } = useTranslation('homePage');

  const moduleCards = [
    {
      title: t('epargneCardTitle'),
      description: t('epargneCardDescription'),
      link: '/epargne',
      icon: PiggyBank,
    },
    {
      title: t('endettementCardTitle'),
      description: t('endettementCardDescription'),
      link: '/endettement',
      icon: Wallet,
    },
    {
      title: t('creditCardTitle'),
      description: t('creditCardDescription'),
      link: '/credit',
      icon: Calculator,
    },
    {
      title: t('immoCardTitle'),
      description: t('immoCardDescription'),
      link: '/immo',
      icon: LandPlot,
    },
    {
      title: t('autresCalculsCardTitle'),
      description: t('autresCalculsCardDescription'),
      link: '/autres-calculs',
      icon: LayoutGrid,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">{t('welcome')}</h1>
        <p className="text-xl text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {moduleCards.map((card, index) => (
          <Link to={card.link} key={index}>
            <Card className="h-full hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <card.icon className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl font-semibold">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Index;