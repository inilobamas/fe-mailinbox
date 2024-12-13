import { useRouter } from "next/navigation"
import { Menu } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

const DropdownMenuComponent: React.FC = () => {
  const router = useRouter()

  const handleLogout = () => {
        router.push('/')
    }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/admin/create-single-email')}>
          Create Single Email
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/admin/create-bulk-email')}>
          Create Bulk Email
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/admin/manage-email')}>
          Manage Email
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuComponent