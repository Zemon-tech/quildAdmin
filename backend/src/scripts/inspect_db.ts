import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { Problem } from '../models/Problem';
import { Pod } from '../models/Pod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
}

async function inspect() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri!);
        console.log('Connected successfully.\n');

        const problems = await Problem.find({});
        console.log(`Found ${problems.length} problems.\n`);

        for (const problem of problems) {
            console.log(`Problem: ${problem.title} (ID: ${problem._id})`);
            console.log(`Slug: ${problem.slug}`);

            // Get pods from the problem's own pods array
            const problemPodRefs = problem.pods || [];
            console.log(`- Pod references in Problem model: ${problemPodRefs.length}`);

            // Get pods that point to this problem from the Pod collection
            const podsFromCollection = await Pod.find({ problem: problem._id });
            console.log(`- Pods found in Pod collection for this problem: ${podsFromCollection.length}`);

            if (podsFromCollection.length > 0) {
                podsFromCollection.forEach(pod => {
                    console.log(`  * Pod: ${pod.title} (ID: ${pod._id}, Order: ${pod.order})`);
                });
            }
            console.log('--------------------------------------------------');
        }

        // Summary of all pods
        const totalPods = await Pod.countDocuments({});
        console.log(`\nTotal Pods in system: ${totalPods}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB.');
    }
}

inspect();
