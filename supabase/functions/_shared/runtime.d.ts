// Hosted Edge Runtime AI embedding API; local Deno does not provide this runtime global.
declare namespace Supabase {
  namespace ai {
    class Session {
      constructor(model: "gte-small");
      run(input: string, options: {mean_pool: boolean; normalize: boolean}): Promise<number[]>;
    }
  }
}
