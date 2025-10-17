import Link from "next/link";
import { ShimmerButton } from "@/components/ui/shimmer-button";

export default function HeroSection() {
    return (
        <>
            <div>
                <div className="container pb-4 pt-4 lg:pb-8">
                    <div className="mt-5 max-w-2xl text-center mx-auto">
                        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                            Exit Interview App - Lyzr AI
                        </h1>
                    </div>
                    <div className="mt-5 max-w-3xl text-center mx-auto">
                        <p className="text-xl text-muted-foreground">
                            Facilitate an AI-powered exit interview process. Provide your feedback to help improve our workplace for future employees.
                        </p>
                    </div>
                    <div className="mt-4 gap-3 flex justify-center">
                        <Link href={`/dashboard`}>
                            <ShimmerButton className="shadow-2xl">
                                Get Started
                            </ShimmerButton>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}