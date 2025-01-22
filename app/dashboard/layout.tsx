'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useUserSettings } from '@/lib/hooks/useUserSettings'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  User2,
  Users
} from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const { settings, loading: settingsLoading } = useUserSettings()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
    } else {
      setUser(user)
      // Buscar dados do perfil do usuário
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      setUserProfile(profile)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="text-primary h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Landing Pages",
      href: "/dashboard/landing-pages",
      icon: <FileText className="text-primary h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Leads",
      href: "/dashboard/leads",
      icon: <Users className="text-primary h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Configurações",
      href: "/dashboard/settings",
      icon: <Settings className="text-primary h-5 w-5 flex-shrink-0" />
    }
  ]

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <div className="flex h-screen overflow-hidden">
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {open ? <Logo /> : <LogoIcon />}
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>
            <div>
              <SidebarLink
                link={{
                  label: user?.user_metadata?.full_name || user?.email || '',
                  href: "#",
                  icon: user?.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      className="h-7 w-7 flex-shrink-0 rounded-full"
                      width={50}
                      height={50}
                      alt="Avatar"
                    />
                  ) : (
                    <User2 className="text-primary h-7 w-7 flex-shrink-0" />
                  ),
                }}
              />
              <SidebarLink
                link={{
                  label: "Sair",
                  href: "#",
                  icon: <LogOut className="text-red-500 dark:text-red-400 h-5 w-5 flex-shrink-0" />,
                }}
                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                onClick={handleSignOut}
              />
            </div>
          </SidebarBody>
        </Sidebar>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-neutral-900">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export const Logo = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        CRM Simplo
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
}; 