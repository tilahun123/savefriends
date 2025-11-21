import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, UtensilsCrossed, LogOut } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { ReactionGame } from "@/components/ReactionGame";
import { GameLeaderboard } from "@/components/GameLeaderboard";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        <div className="flex justify-between items-center pt-4">
          <div>
            <h1 className="text-3xl font-bold">Meal Card Sharing</h1>
            <p className="text-muted-foreground">Share or claim meal cards with fellow students</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/share")}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-primary" />
                <CardTitle>Share Meal Card</CardTitle>
              </div>
              <CardDescription>
                Have a cafeteria meal card? Share it with students who need it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Share Your Card
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/claim")}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                <CardTitle>Get Free Meal Card</CardTitle>
              </div>
              <CardDescription>
                Need cafeteria access? Browse and claim available meal cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary">
                Browse Available Cards
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Share Your Card</h3>
                <p className="text-sm text-muted-foreground">
                  If you have a cafeteria meal card, share your card number along with your university and campus details.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Browse Available Cards</h3>
                <p className="text-sm text-muted-foreground">
                  Students without cafeteria access can browse available meal cards from their university.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Claim and Use</h3>
                <p className="text-sm text-muted-foreground">
                  Once you claim a card, it becomes unavailable to others. Use the meal card number to access the cafeteria.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <ReactionGame onScoreSubmitted={() => setLeaderboardRefresh(prev => prev + 1)} />
          <GameLeaderboard refreshTrigger={leaderboardRefresh} />
        </div>
      </div>
    </div>
  );
};

export default Index;
