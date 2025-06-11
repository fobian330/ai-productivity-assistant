
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import type { TimeBlock } from '../../../server/src/schema';

interface TimeBlockCalendarProps {
  timeBlocks: TimeBlock[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function TimeBlockCalendar({ 
  timeBlocks, 
  selectedDate, 
  onDateChange
}: TimeBlockCalendarProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  // Group time blocks by hour for better visualization
  const timeBlocksByHour = timeBlocks.reduce((acc: Record<string, TimeBlock[]>, block: TimeBlock) => {
    const hour = new Date(block.start_time).getHours();
    const hourKey = `${hour.toString().padStart(2, '0')}:00`;
    if (!acc[hourKey]) acc[hourKey] = [];
    acc[hourKey].push(block);
    return acc;
  }, {});

  // Generate hourly slots for the day
  const generateHourlySlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      slots.push({
        time: hourKey,
        displayTime: new Date(2024, 0, 1, hour, 0).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          hour12: true 
        }),
        blocks: timeBlocksByHour[hourKey] || []
      });
    }
    return slots;
  };

  const hourlySlots = generateHourlySlots();

  // Calculate duration in minutes
  const calculateDuration = (startTime: Date, endTime: Date) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            size="sm"
          >
            📋 List View
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
            size="sm"
          >
            📅 Calendar View
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          {timeBlocks.length} blocks scheduled
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Picker */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">📅 Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date: Date | undefined) => date && onDateChange(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Time Blocks Display */}
        <div className="lg:col-span-2">
          {viewMode === 'list' ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  🕐 Schedule for {selectedDate.toDateString()}
                  <Badge variant="secondary">
                    {timeBlocks.filter((b: TimeBlock) => b.is_ai_suggested).length} AI suggested
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeBlocks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📅</div>
                    <h3 className="text-lg font-semibold mb-2">No time blocks scheduled</h3>
                    <p className="text-gray-600">
                      Ask me to schedule some time blocks or use the AI generator!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timeBlocks
                      .sort((a: TimeBlock, b: TimeBlock) => 
                        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                      )
                      .map((block: TimeBlock) => {
                        const startTime = new Date(block.start_time);
                        const endTime = new Date(block.end_time);
                        const duration = calculateDuration(startTime, endTime);

                        return (
                          <div
                            key={block.id}
                            className={`p-4 rounded-lg border-l-4 ${
                              block.is_ai_suggested 
                                ? 'border-l-purple-400 bg-purple-50' 
                                : 'border-l-blue-400 bg-blue-50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {block.title}
                                </h4>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                  <span>
                                    🕐 {startTime.toLocaleTimeString('en-US', { 
                                      hour: 'numeric', 
                                      minute: '2-digit',
                                      hour12: true 
                                    })} - {endTime.toLocaleTimeString('en-US', { 
                                      hour: 'numeric', 
                                      minute: '2-digit',
                                      hour12: true 
                                    })}
                                  </span>
                                  <span>⏱️ {duration} minutes</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {block.is_ai_suggested && (
                                  <Badge className="bg-purple-100 text-purple-800">
                                    🤖 AI Suggested
                                  </Badge>
                                )}
                                {block.task_id && (
                                  <Badge variant="outline">
                                    🎯 Task Linked
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Hourly Grid View */
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>🕐 Daily Schedule Grid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {hourlySlots.map((slot) => (
                    <div key={slot.time} className="flex items-start gap-4 py-2 border-b border-gray-100">
                      <div className="w-16 text-sm font-medium text-gray-600 mt-1">
                        {slot.displayTime}
                      </div>
                      <div className="flex-1">
                        {slot.blocks.length === 0 ? (
                          <div className="text-gray-400 text-sm italic">No blocks scheduled</div>
                        ) : (
                          <div className="space-y-2">
                            {slot.blocks.map((block: TimeBlock) => {
                              const startTime = new Date(block.start_time);
                              const endTime = new Date(block.end_time);
                              const duration = calculateDuration(startTime, endTime);

                              return (
                                <div
                                  key={block.id}
                                  className={`p-3 rounded-lg ${
                                    block.is_ai_suggested 
                                      ? 'bg-purple-100 border border-purple-200' 
                                      : 'bg-blue-100 border border-blue-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium text-sm">{block.title}</div>
                                      <div className="text-xs text-gray-600">
                                        {startTime.toLocaleTimeString('en-US', { 
                                          hour: 'numeric', 
                                          minute: '2-digit',
                                          hour12: true 
                                        })} - {endTime.toLocaleTimeString('en-US', { 
                                          hour: 'numeric', 
                                          minute: '2-digit',
                                          hour12: true 
                                        })} ({duration}min)
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      {block.is_ai_suggested && (
                                        <Badge className="bg-purple-200 text-purple-800 text-xs">
                                          🤖
                                        </Badge>
                                      )}
                                      {block.task_id && (
                                        <Badge variant="outline" className="text-xs">
                                          🎯
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
