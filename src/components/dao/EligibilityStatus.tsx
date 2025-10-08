import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface EligibilityStatusProps {
  wallet: string;
  eligibility: any;
}

const EligibilityStatus = ({ wallet, eligibility }: EligibilityStatusProps) => {
  if (!eligibility) {
    return (
      <Card className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          Not Eligible
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          You need to meet one of these criteria:
        </p>
        <ul className="text-sm space-y-2">
          <li>• Hold a token for 30+ days</li>
          <li>• Invite 10+ new wallets</li>
          <li>• High AI participation score</li>
        </ul>
      </Card>
    );
  }

  const getEligibilityIcon = () => {
    if (eligibility.is_eligible) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  const getTypeLabel = () => {
    switch (eligibility.eligibility_type) {
      case "holding":
        return "Token Holder";
      case "invites":
        return "Invite Champion";
      case "AI_score":
        return "AI Contributor";
      default:
        return eligibility.eligibility_type;
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        {getEligibilityIcon()}
        {eligibility.is_eligible ? "DAO Eligible" : "Pending Eligibility"}
      </h3>

      {eligibility.is_eligible && (
        <div className="space-y-4">
          <div>
            <Badge className="mb-2">{getTypeLabel()}</Badge>
            <p className="text-sm text-muted-foreground">
              Qualified since {new Date(eligibility.eligibility_date).toLocaleDateString()}
            </p>
          </div>

          {eligibility.invite_count > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Invites: {eligibility.invite_count}</p>
              <Progress value={(eligibility.invite_count / 10) * 100} className="h-2" />
            </div>
          )}

          {eligibility.ai_score > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">AI Score: {eligibility.ai_score}</p>
              <Progress value={eligibility.ai_score} className="h-2" />
            </div>
          )}

          {eligibility.whale_status && (
            <Badge variant="outline" className="mt-2">
              🐋 Whale Status
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
};

export default EligibilityStatus;
