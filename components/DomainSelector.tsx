import { useState, useEffect } from "react"
import axios from "axios"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuthStore } from "@/stores/useAuthStore"

interface Domain {
  ID: number
  Domain: string
}

interface DomainSelectorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function DomainSelector({ value, onChange, className }: DomainSelectorProps) {
  const [domains, setDomains] = useState<Domain[]>([])
  const token = useAuthStore((state) => state.token)
  
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        if (!token) {
          return;
        }
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/domain/dropdown`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        setDomains(response.data)
        // Set default domain if no value is provided
        if (!value && response.data.length > 0) {
          const defaultDomainObj = response.data[0]
          onChange(defaultDomainObj.Domain)
        }
      } catch (error) {
        console.error('Failed to fetch domains:', error)
      }
    }

    fetchDomains()
  }, [token]) // Only fetch once when component mounts

  return (
    <Select
      value={value}
      onValueChange={onChange}
    >
      <SelectTrigger className={className || "w-[180px]"}>
        <SelectValue placeholder="Select domain" />
      </SelectTrigger>
      <SelectContent>
        {domains.map((domain) => (
          <SelectItem key={domain.ID} value={domain.Domain}>
            {domain.Domain}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}