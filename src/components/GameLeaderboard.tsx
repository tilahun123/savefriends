import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeaderboardEntry {
  id: string;
  score: number;
  created_at: string;
  profiles: {
    email: string;
  } | null;
}

export const GameLeaderboard = ({ refreshTrigger }: { refreshTrigger: number }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [refreshTrigger]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("game_scores")
      .select(`
        id,
        score,
        created_at,
        user_id
      `)
      .eq("game_type", "reaction")
      .order("score", { ascending: true })
      .limit(10);

    if (!error && data) {
      // Fetch profiles for each user
      const userIds = data.map(entry => entry.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      const enrichedData = data.map(entry => ({
        ...entry,
        profiles: profilesMap.get(entry.user_id) || null
      }));
      
      setLeaderboard(enrichedData);
    }
    setLoading(false);
  };

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-primary" />
          <CardTitle>Leaderboard</CardTitle>
        </div>
        <CardDescription>
          Top 10 fastest reaction times
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : leaderboard.length === 0 ? (
          <p className="text-center text-muted-foreground">No scores yet. Be the first to play!</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Time (ms)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry, index) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-bold">
                    {getMedalEmoji(index)}
                  </TableCell>
                  <TableCell>{entry.profiles?.email || "Anonymous"}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={index < 3 ? "default" : "secondary"}>
                      {entry.score}ms
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
