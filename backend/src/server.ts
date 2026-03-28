import env from "./config/env";
import app from "./app";
import connectDB from './config/database';
import { EscrowService } from './services';

const HOUR_MS = 60 * 60 * 1000;

const start = async () => {
  try {
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
    });

    const runEscrowAutoRelease = () => {
      EscrowService.autoReleaseStalePendingBuyerConfirmation()
        .then((n) => {
          if (n > 0) {
            console.log(
              `[escrow] Auto-released funds on ${n} order(s) after buyer confirmation window`,
            );
          }
        })
        .catch((err) => console.error('[escrow] auto-release job failed:', err));
    };

    setInterval(runEscrowAutoRelease, HOUR_MS);
    setTimeout(runEscrowAutoRelease, 15_000);
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
};

start();