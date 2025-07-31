import { Outlet } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import Authimage from "./WhatsApp Image 2025-07-29 at 16.34.01.jpeg";
const AuthLayout = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-3xl">
          <Card className="overflow-hidden">
            <CardContent className="grid p-0 md:grid-cols-2">
              <Outlet />
              <div className="relative hidden bg-muted md:block">
                <img
                  src={Authimage}
                  alt="Image"
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* <div className='text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary'>
				By clicking continue, you agree to our <a href='#'>Terms of Service</a>{' '}
				and <a href='#'>Privacy Policy</a>.
			</div> */}
    </div>
  );
};

export default AuthLayout;
