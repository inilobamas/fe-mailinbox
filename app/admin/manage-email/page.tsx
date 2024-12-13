"use client"

import { useState, useEffect } from "react"
import FooterAdminNav from "@/components/FooterAdminNav"

type Email = {
  id: string
  email: string
  password: string
}

export default function ManageEmailPage() {
  const [emails, setEmails] = useState<Email[]>([])

  useEffect(() => {
    // Simulate fetching email data
    setTimeout(() => {
      setEmails([
        { id: '1', email: 'john@example.com', password: 'password123' },
        { id: '2', email: 'jane@example.com', password: 'password456' },
        // Add more emails as needed
      ])
    }, 1000)
  }, [])

  return (
    <div className="flex min-h-screen justify-center bg-white p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Coming Soon
          </h1>
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Email List</h2>
          <ul className="space-y-2">
            {emails.map(email => (
              <li key={email.id} className="p-4 border rounded">
                <p><strong>Email:</strong> {email.email}</p>
                <p><strong>Password:</strong> {email.password}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <FooterAdminNav />
    </div>
  )
}