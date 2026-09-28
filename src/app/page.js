import styles from "./page.module.css";
import SmoothScroll from "@/components/home/SmoothScroll";

import PageOne from "@/components/home/sections/PageOne";
import PageTwo from "@/components/home/sections/PageTwo";
import PageThree from "@/components/home/sections/PageThree";
import PageFour from "@/components/home/sections/PageFour";
import HomeMotion from "@/components/home/HomeMotion";

export default function Home() {
    return (
        <main className={styles.home}>
            <SmoothScroll />
            <HomeMotion />
            <PageOne />
            <PageTwo />
            <PageThree />
            <PageFour />
        </main>
    );
}
