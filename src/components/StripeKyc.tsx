import { useEffect, useState } from "react";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { getFunctions, httpsCallable } from "firebase/functions";

interface Props {
  onComplete?: () => void;
}

export default function StripeKYC({ onComplete }: Props) {
  const [stripeConnectInstance, setStripeConnectInstance] = useState<any>(null);

  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        const functions = getFunctions(undefined, "europe-west1");
        const getStripeAccountSession = httpsCallable(
          functions,
          "getStripeAccountSession"
        );

          const result = await getStripeAccountSession();
          console.log(result.data)
        const data = result.data as {
          success: boolean;
          accountId: string;
          clientSecret: string;
        };

        console.log("✅ Got client secret for account:", data.accountId);

        // Initialize Stripe Connect
        const instance = loadConnectAndInitialize({
          publishableKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
          fetchClientSecret: async () => data.clientSecret,
          appearance: {
            overlays: "dialog",
            variables: {
              colorPrimary: "#635BFF",
            },
          },
        });

        setStripeConnectInstance(instance);
      } catch (error) {
        console.error("Error fetching client secret:", error);
      }
    };

    fetchClientSecret();
  }, []);

  if (!stripeConnectInstance) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification...</p>
        </div>
      </div>
    );
  }

  return (
    <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
      <ConnectAccountOnboarding
        onExit={() => {
          console.log("✅ KYC onboarding completed or exited");
          onComplete?.();
        }}
      />
    </ConnectComponentsProvider>
  );
}
