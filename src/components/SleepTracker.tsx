
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { Moon, Sun, Clock, TrendingUp } from 'lucide-react';
import { api } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SleepRecord {
  id: string;
  date: string;
  sleepTime: string;
  wakeTime: string;
  quality: number;
  duration: number;
  notes: string;
}

const SleepTracker = () => {
  const { toast } = useToast();
  const [sleepTime, setSleepTime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [quality, setQuality] = useState(7);
  const [notes, setNotes] = useState('');
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(true);

  // Load sleep records on component mount
  React.useEffect(() => {
    loadSleepRecords();
  }, []);

  const loadSleepRecords = async () => {
    setRecordsLoading(true);
    try {
      const response = await api.getSleepRecords();
      if (response.data) {
        setSleepRecords(response.data);
      }
    } catch (error) {
      console.error('Failed to load sleep records:', error);
      toast({
        title: "Error",
        description: "Failed to load sleep records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRecordsLoading(false);
    }
  };

  const calculateDuration = (sleepTime: string, wakeTime: string) => {
    const [sleepHours, sleepMinutes] = sleepTime.split(':').map(Number);
    const [wakeHours, wakeMinutes] = wakeTime.split(':').map(Number);
    
    let sleepDate = new Date();
    sleepDate.setHours(sleepHours, sleepMinutes, 0);
    
    let wakeDate = new Date();
    wakeDate.setHours(wakeHours, wakeMinutes, 0);
    
    // If wake time is earlier than sleep time, add a day to wake time
    if (wakeDate.getTime() < sleepDate.getTime()) {
      wakeDate.setDate(wakeDate.getDate() + 1);
    }
    
    // Calculate difference in hours
    const diff = (wakeDate.getTime() - sleepDate.getTime()) / (1000 * 60 * 60);
    return parseFloat(diff.toFixed(1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const duration = calculateDuration(sleepTime, wakeTime);
    
    if (duration < 0 || duration > 24) {
      toast({
        title: "Invalid sleep duration",
        description: "Please check your sleep and wake times.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.saveSleepRecord({
        sleepTime,
        wakeTime,
        quality,
        duration,
        notes,
        date: new Date().toISOString(),
      });
      
      if (response.data) {
        toast({
          title: "Sleep record saved",
          description: "Your sleep record has been saved successfully.",
        });
        
        // Reset form
        setNotes('');
        
        // Reload records
        loadSleepRecords();
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to save sleep record:', error);
      toast({
        title: "Error",
        description: "Failed to save sleep record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getQualityLabel = (quality: number) => {
    if (quality <= 3) return 'Poor';
    if (quality <= 6) return 'Average';
    if (quality <= 8) return 'Good';
    return 'Excellent';
  };

  const getSleepStatusMessage = (records: SleepRecord[]) => {
    if (records.length === 0) return null;
    
    // Calculate average duration
    const avgDuration = records.reduce((sum, record) => sum + record.duration, 0) / records.length;
    
    // Calculate average quality
    const avgQuality = records.reduce((sum, record) => sum + record.quality, 0) / records.length;
    
    let message = '';
    
    if (avgDuration < 6) {
      message = "You're not getting enough sleep. Try to get at least 7-8 hours of sleep each night.";
    } else if (avgDuration > 9) {
      message = "You might be sleeping too much. 7-8 hours of sleep is typically optimal for adults.";
    } else {
      message = "Your sleep duration looks good. Keep it up!";
    }
    
    if (avgQuality < 5) {
      message += " Your sleep quality could be better. Consider improving your sleep environment or routine.";
    } else {
      message += " And your sleep quality is good!";
    }
    
    return message;
  };

  const chartData = sleepRecords.slice(-7).map(record => ({
    date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    duration: record.duration,
    quality: record.quality / 10 * record.duration // Scale quality to fit with duration
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Moon className="mr-2 h-5 w-5" />
            Track Your Sleep
          </CardTitle>
          <CardDescription>
            Record your sleep times and quality to help improve your sleep habits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Moon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="sleepTime">Bedtime</Label>
                </div>
                <Input
                  id="sleepTime"
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Sun className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="wakeTime">Wake Time</Label>
                </div>
                <Input
                  id="wakeTime"
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="quality" className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                  Sleep Quality ({getQualityLabel(quality)})
                </Label>
                <span className="text-sm text-muted-foreground">{quality}/10</span>
              </div>
              <Slider
                id="quality"
                min={1}
                max={10}
                step={1}
                value={[quality]}
                onValueChange={(value) => setQuality(value[0])}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="Any factors affecting your sleep? (stress, caffeine, etc.)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Sleep Record"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Sleep Insights
          </CardTitle>
          <CardDescription>
            Visualize your sleep patterns over the past week
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p>Loading sleep records...</p>
            </div>
          ) : sleepRecords.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">No sleep records yet. Start tracking your sleep above.</p>
            </div>
          ) : (
            <>
              <div className="h-[300px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="duration" name="Sleep Duration (hours)" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2 flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analysis
                </h4>
                <p>{getSleepStatusMessage(sleepRecords)}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SleepTracker;
