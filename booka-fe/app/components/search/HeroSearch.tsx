import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Calendar } from '~/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { MapPin, Users, Search, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '~/lib/utils';
import { useDebounce } from '~/hooks/useDebounce';

export interface SearchParams {
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  capacity?: number;
}

interface HeroSearchProps {
  onSearch: (params: SearchParams) => void;
  initialParams?: SearchParams;
}

/**
 * Hero search component with location, date range, and guests selector
 */
export function HeroSearch({ onSearch, initialParams }: HeroSearchProps) {
  const [location, setLocation] = useState(initialParams?.location || '');
  const [checkIn, setCheckIn] = useState<Date | undefined>(
    initialParams?.dateFrom ? new Date(initialParams.dateFrom) : undefined
  );
  const [checkOut, setCheckOut] = useState<Date | undefined>(
    initialParams?.dateTo ? new Date(initialParams.dateTo) : undefined
  );
  const [capacity, setCapacity] = useState<string>(initialParams?.capacity?.toString() || '');

  const debouncedLocation = useDebounce(location, 300);

  const handleSearch = () => {
    onSearch({
      location: debouncedLocation || undefined,
      dateFrom: checkIn ? format(checkIn, 'yyyy-MM-dd') : undefined,
      dateTo: checkOut ? format(checkOut, 'yyyy-MM-dd') : undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="Where are you going?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Check-in
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !checkIn && 'text-muted-foreground'
                  )}
                >
                  {checkIn ? format(checkIn, 'MMM dd, yyyy') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkIn}
                  onSelect={setCheckIn}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Check-out
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !checkOut && 'text-muted-foreground'
                  )}
                >
                  {checkOut ? format(checkOut, 'MMM dd, yyyy') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={setCheckOut}
                  disabled={(date) => (checkIn ? date <= checkIn : date < new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Guests
            </Label>
            <Select value={capacity} onValueChange={setCapacity}>
              <SelectTrigger id="guests">
                <SelectValue placeholder="Guests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 guest</SelectItem>
                <SelectItem value="2">2 guests</SelectItem>
                <SelectItem value="3">3 guests</SelectItem>
                <SelectItem value="4">4 guests</SelectItem>
                <SelectItem value="5">5+ guests</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleSearch}
          className="w-full md:w-auto flex items-center gap-2 shadow-2xl"
          size="lg"
        >
          <Search className="h-5 w-5" />
          Search
        </Button>
      </div>
    </div>
  );
}

