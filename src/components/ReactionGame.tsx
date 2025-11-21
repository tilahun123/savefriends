import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";

export const ReactionGame = ({ onScoreSubmitted }: { onScoreSubmitted: () => void }) => {
  const [gameState, setGameState] = useState<"idle" | "waiting" | "ready" | "clicked">("idle");
  const [startTime, setStartTime] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const { toast } = useToast();

  const startGame = useCallback(() => {
    setGameState("waiting");
    setReactionTime(null);
    
    const delay = Math.random() * 3000 + 2000; // Random delay between 2-5 seconds
    setTimeout(() => {
      setGameState("ready");
      setStartTime(Date.now());
    }, delay);
  }, []);

  const handleClick = useCallback(async () => {
    if (gameState === "waiting") {
      setGameState("idle");
      toast({
        title: "Too early!",
        description: "Wait for the green background!",
        variant: "destructive",
      });
      return;
    }

    if (gameState === "ready") {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setGameState("clicked");

      // Save score to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from("game_scores")
          .insert({ user_id: user.id, score: time, game_type: "reaction" });

        if (error) {
          toast({
            title: "Error saving score",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Score saved!",
            description: `${time}ms reaction time`,
          });
          onScoreSubmitted();
        }
      }
    }
  }, [gameState, startTime, toast, onScoreSubmitted]);

  const getBackgroundColor = () => {
    switch (gameState) {
      case "waiting":
        return "bg-destructive";
      case "ready":
        return "bg-green-500";
      default:
        return "bg-muted";
    }
  };

  const getInstructions = () => {
    switch (gameState) {
      case "idle":
        return "Click 'Start' to begin";
      case "waiting":
        return "Wait for green...";
      case "ready":
        return "CLICK NOW!";
      case "clicked":
        return `Your time: ${reactionTime}ms`;
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-primary" />
          <CardTitle>Reaction Time Game</CardTitle>
        </div>
        <CardDescription>
          Test your reflexes! Click when the background turns green.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`${getBackgroundColor()} transition-colors duration-300 rounded-lg p-12 cursor-pointer flex items-center justify-center min-h-[200px]`}
          onClick={handleClick}
        >
          <p className="text-2xl font-bold text-center">
            {getInstructions()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={startGame}
            disabled={gameState === "waiting" || gameState === "ready"}
            className="w-full"
          >
            {gameState === "idle" || gameState === "clicked" ? "Start Game" : "Game in Progress..."}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
