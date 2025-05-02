"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const languages = [
  { value: "en", label: "English" },
  { value: "pcm", label: "Nigerian Pidgin" },
  { value: "yo", label: "Yoruba" },
  { value: "ha", label: "Hausa" },
  { value: "ig", label: "Igbo" },
]

interface LanguageSwitcherProps {
  className?: string
}

/**
 * A component for switching between different languages
 */
export default function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(languages[0])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("flex w-auto items-center justify-between gap-2", className)}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.label}</span>
          <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {languages.map((language) => (
                <CommandItem
                  key={language.value}
                  value={language.value}
                  onSelect={() => {
                    setCurrentLanguage(language)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentLanguage.value === language.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {language.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
