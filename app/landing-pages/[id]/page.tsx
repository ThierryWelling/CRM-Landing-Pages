'use client'

import { Suspense } from 'react'
import LandingPageView from './view/page'

export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LandingPageView params={params} />
    </Suspense>
  )
} 