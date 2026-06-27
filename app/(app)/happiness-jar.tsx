// app/(app)/happiness-jar.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated,
    Dimensions, Vibration, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Accelerometer } from 'expo-sensors';
import { useFocusEffect } from 'expo-router';

const { width, height } = Dimensions.get('window');
const JAR_SIZE = Math.min(width * 0.55, 200);
const JAR_HEIGHT = JAR_SIZE * 1.35;

// ── Theme config ──
type ThemeName = 'night_sky' | 'girlie' | 'nature' | 'gamer';

interface ThemeConfig {
    accentColor: string;
    accentGlow: string;
    cardBg: string;
    cardBorder: string;
    surfaceBg: string;
    jarColor: string;
    jarGlow: string;
    noteEmoji: string;
    fillColor: string;
    lidColor: string;
    labelBg: string;
}

// Note interface with timestamp
interface HappinessNote {
    note: string;
    collected_at: string; // ISO date string
}

const JAR_THEMES: Record<ThemeName, ThemeConfig> = {
    night_sky: {
        accentColor: Colors.yellow,
        accentGlow: Colors.yellowGlow,
        cardBg: '#1A1A2E',
        cardBorder: '#2A2A4E',
        surfaceBg: '#16213E',
        jarColor: '#FFD700',
        jarGlow: '#FFD70020',
        noteEmoji: '💌',
        fillColor: '#FFD700',
        lidColor: '#B8960F',
        labelBg: '#1A1A2E',
    },
    girlie: {
        accentColor: '#F472B6',
        accentGlow: '#F472B620',
        cardBg: '#2D1B2E',
        cardBorder: '#3D2840',
        surfaceBg: '#261828',
        jarColor: '#F9A8D4',
        jarGlow: '#F9A8D420',
        noteEmoji: '💖',
        fillColor: '#F9A8D4',
        lidColor: '#C47DA8',
        labelBg: '#2D1B2E',
    },
    nature: {
        accentColor: '#34D399',
        accentGlow: '#34D39920',
        cardBg: '#1A2E23',
        cardBorder: '#254535',
        surfaceBg: '#15261E',
        jarColor: '#6EE7B7',
        jarGlow: '#6EE7B720',
        noteEmoji: '🌿',
        fillColor: '#6EE7B7',
        lidColor: '#4DA882',
        labelBg: '#1A2E23',
    },
    gamer: {
        accentColor: '#A78BFA',
        accentGlow: '#A78BFA20',
        cardBg: '#1E1B3A',
        cardBorder: '#2E2A52',
        surfaceBg: '#181535',
        jarColor: '#C4B5FD',
        jarGlow: '#C4B5FD20',
        noteEmoji: '💎',
        fillColor: '#C4B5FD',
        lidColor: '#8B7EC8',
        labelBg: '#1E1B3A',
    },
};

// 100+ happy notes
const HAPPY_NOTES = [
    "You are loved 💕", "Today is a gift 🎁", "You make the world brighter ✨",
    "Keep shining! 🌟", "You're doing great! 💪", "Believe in yourself 🦋",
    "Smile, it's contagious 😊", "You are enough 💖", "Every day is a fresh start 🌅",
    "You're a star! ⭐", "Happiness looks good on you 😄", "You're wonderful 🌸",
    "Stay positive! 🌈", "You've got this! 🎯", "You're amazing! 💫",
    "Good vibes only ✌️", "You light up the room 💡", "You're a blessing 🌻",
    "Keep going! 🚀", "You inspire others 💝", "Today is yours! 🎉",
    "You're magical ✨", "Chase your dreams 🌙", "You're unstoppable! 🔥",
    "Joy comes in the morning ☀️", "You're beautiful inside and out 🌷",
    "Never give up! 🏆", "You matter 💎", "The world needs you 🌍",
    "You're a ray of sunshine 🌞", "Great things are coming 🎊", "You're one of a kind 🦄",
    "Love yourself first 💗", "You're stronger than you know 💪", "Be happy! 🎈",
    "You're a treasure 💰", "Sparkle wherever you go ✨", "You're loved beyond measure ❤️",
    "Choose joy 🌺", "You're incredible! 🌟", "Keep your head up 👑",
    "You're a masterpiece 🎨", "Today will be amazing 🌈", "You're so talented 🎭",
    "Happiness is a choice 😃", "You're a warrior ⚔️", "Shine bright! 💎",
    "You're a gift to this world 🎀", "Stay golden 🌟", "You're phenomenal! 🦋",
    "The best is yet to come 🎶", "You're a diamond 💠", "Radiate positivity ☀️",
    "You're extraordinary! 🌌", "Keep smiling! 😁", "You're a superstar 🌠",
    "Life is beautiful 🌸", "You're a blessing to many 🙏", "Stay awesome! 😎",
    "You're destined for greatness 🏅", "Enjoy the little things 🍀", "You're breathtaking! 💨",
    "You have a heart of gold 💛", "Keep dreaming big! 🌌", "You're a light in the darkness 🕯️",
    "Your smile lights up the room 💡", "You're doing amazing sweetie 💅",
    "You're the main character 🎬", "Good things take time ⏳", "You're worth it! 💯",
    "You're a whole vibe ✨", "Slay the day! 👑", "You're iconic 🌟",
    "You've got the magic touch 🪄", "You're a legend in the making 🏆",
    "Protect your peace 🕊️", "You're simply the best 🎵", "You're glowing! ✨",
    "You're a breath of fresh air 🌬️", "You make life sweeter 🍯", "You're precious 💎",
    "You're a ray of hope 🌈", "You're unforgettable 💫", "You're pure magic 🪄",
    "You're a work of art 🖼️", "You're the cherry on top 🍒", "You're golden 🌟",
    "You're a sunflower 🌻", "You're a pearl 🦪", "You're the icing on the cake 🧁",
    "You're a rainbow after the rain 🌈", "You're a cozy blanket ☕",
    "You're a warm hug 🤗", "You're a shooting star 🌠", "You're a lucky charm 🍀",
    "You're a sweet melody 🎶", "You're a gentle breeze 🍃", "You're a full moon 🌕",
    "You're a firework 🎆", "You're a cozy fireplace 🔥", "You're a morning sunrise 🌄",
];

// Pre-compute random positions for floating notes (seeded so they stay consistent)
const FLOATING_POSITIONS = Array.from({ length: 16 }, (_, i) => ({
    top: 18 + ((i * 47 + 13) % 140),
    left: 10 + ((i * 31 + 7) % 110),
    rotate: ((i * 17 - 8) % 36) - 18,
    scale: 0.85 + ((i * 7) % 30) / 100,
}));

export default function HappinessJarScreen() {
    const { session } = useAuth();
    const user = session?.user;
    const router = useRouter();

    const [themeName, setThemeName] = useState<ThemeName>('night_sky');
    const theme = JAR_THEMES[themeName];

    const [notes, setNotes] = useState<HappinessNote[]>([]);
    const [todayClaimed, setTodayClaimed] = useState(false);
    const [todaysNote, setTodaysNote] = useState<string | null>(null);
    const [showNote, setShowNote] = useState(false);
    const [shakeCount, setShakeCount] = useState(0);
    const [isShaking, setIsShaking] = useState(false);
    const [showNotesList, setShowNotesList] = useState(false);
    const [isNativeSupported, setIsNativeSupported] = useState(true);
    const [alreadyClaimedMessage, setAlreadyClaimedMessage] = useState(false);

    // Animations
    const jarShake = useRef(new Animated.Value(0)).current;
    const noteOpacity = useRef(new Animated.Value(0)).current;
    const noteSlide = useRef(new Animated.Value(30)).current;
    const sparkle1 = useRef(new Animated.Value(0)).current;
    const sparkle2 = useRef(new Animated.Value(0)).current;
    const sparkle3 = useRef(new Animated.Value(0)).current;
    const fillHeight = useRef(new Animated.Value(0)).current;
    const messageOpacity = useRef(new Animated.Value(0)).current;
    const jarPulse = useRef(new Animated.Value(1)).current;

    // Accelerometer
    const [{ x, y, z }, setData] = useState({ x: 0, y: 0, z: 0 });
    const [subscription, setSubscription] = useState<any>(null);
    const lastShakeTime = useRef(Date.now());
    const shakeThreshold = 1.5;

    const _subscribe = () => {
        try {
            setSubscription(Accelerometer.addListener(setData));
            Accelerometer.setUpdateInterval(150);
        } catch (e) {
            setIsNativeSupported(false);
        }
    };

    const _unsubscribe = () => {
        if (subscription) {
            try { subscription.remove(); } catch (e) { }
            setSubscription(null);
        }
    };

    const loadThemeAndData = async () => {
        if (!user) return;

        try {
            // Load theme
            const { data: profile } = await supabase
                .from('profiles')
                .select('theme')
                .eq('id', user.id)
                .single();

            if (profile?.theme && JAR_THEMES[profile.theme as ThemeName]) {
                setThemeName(profile.theme as ThemeName);
            }

            // Load jar data
            const { data: jarData, error } = await supabase
                .from('happiness_jar')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No data found, create initial jar
                    const { error: insertError } = await supabase
                        .from('happiness_jar')
                        .insert({
                            user_id: user.id,
                            notes: [], // JSONB accepts JavaScript array
                            last_claimed: null,
                            todays_note: null,
                        });

                    if (!insertError) {
                        setNotes([]);
                        setTodayClaimed(false);
                        setShowNote(false);
                    }
                } else {
                    console.error('Error fetching jar data:', error);
                }
                return;
            }

            if (jarData) {
                // With JSONB, Supabase returns notes as a JavaScript array automatically
                const parsedNotes = Array.isArray(jarData.notes) ? jarData.notes : [];

                // Update notes state
                setNotes(parsedNotes);

                // Handle today's claimed status
                const lastClaimed = jarData.last_claimed ? new Date(jarData.last_claimed) : null;
                const today = new Date();

                if (lastClaimed && lastClaimed.toDateString() === today.toDateString()) {
                    setTodayClaimed(true);
                    setTodaysNote(jarData.todays_note || null);
                    setShowNote(true);
                    noteOpacity.setValue(1);
                    noteSlide.setValue(0);
                } else {
                    setTodayClaimed(false);
                    setTodaysNote(null);
                    setShowNote(false);
                }
            }
        } catch (error) {
            console.error('Error loading jar data:', error);
        }
    };

    const handleTapShake = () => {
        if (todayClaimed) {
            setAlreadyClaimedMessage(true);
            Animated.sequence([
                Animated.timing(messageOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.delay(2000),
                Animated.timing(messageOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]).start(() => setAlreadyClaimedMessage(false));
            return;
        }
        if (isShaking) return;
        setShakeCount(prev => {
            const newCount = prev + 1;
            triggerShake();
            if (newCount >= 3) setTimeout(revealNote, 400);
            return newCount;
        });
    };

    const triggerShake = () => {
        if (todayClaimed) return;
        setIsShaking(true);
        if (isNativeSupported) {
            try { Vibration.vibrate(100); } catch (e) { }
        }
        Animated.sequence([
            Animated.timing(jarShake, { toValue: 12, duration: 40, useNativeDriver: true }),
            Animated.timing(jarShake, { toValue: -12, duration: 40, useNativeDriver: true }),
            Animated.timing(jarShake, { toValue: 8, duration: 40, useNativeDriver: true }),
            Animated.timing(jarShake, { toValue: -8, duration: 40, useNativeDriver: true }),
            Animated.timing(jarShake, { toValue: 4, duration: 40, useNativeDriver: true }),
            Animated.timing(jarShake, { toValue: 0, duration: 40, useNativeDriver: true }),
        ]).start(() => setIsShaking(false));
    };

    const revealNote = async () => {
        if (!user || todayClaimed) return;

        // Check if already claimed today
        const { data: freshData } = await supabase
            .from('happiness_jar')
            .select('last_claimed, notes')
            .eq('user_id', user.id)
            .single();

        if (freshData?.last_claimed) {
            const lastClaimed = new Date(freshData.last_claimed);
            const today = new Date();
            if (lastClaimed.toDateString() === today.toDateString()) {
                setTodayClaimed(true);
                return;
            }
        }

        // Get current notes - no parsing needed with JSONB
        const currentNotes = Array.isArray(freshData?.notes) ? freshData.notes : [];

        // Filter out already collected notes
        const collectedNoteTexts = currentNotes.map((n: any) =>
            typeof n === 'string' ? n : n.note
        );

        const availableNotes = HAPPY_NOTES.filter(n => !collectedNoteTexts.includes(n));

        const randomNote = availableNotes.length > 0
            ? availableNotes[Math.floor(Math.random() * availableNotes.length)]
            : HAPPY_NOTES[Math.floor(Math.random() * HAPPY_NOTES.length)];

        setTodaysNote(randomNote);
        setTodayClaimed(true);
        setShowNote(true);

        // Trigger animations
        const sparkles = [sparkle1, sparkle2, sparkle3];
        sparkles.forEach((sparkle, i) => {
            Animated.sequence([
                Animated.delay(i * 150),
                Animated.spring(sparkle, { toValue: 1, useNativeDriver: true, tension: 60, friction: 4 }),
                Animated.timing(sparkle, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]).start();
        });

        Animated.parallel([
            Animated.spring(noteOpacity, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
            Animated.spring(noteSlide, { toValue: 0, useNativeDriver: true, tension: 50, friction: 7 }),
        ]).start();

        // Create new note object
        const newNote: HappinessNote = {
            note: randomNote,
            collected_at: new Date().toISOString(),
        };

        const updatedNotes = [...currentNotes, newNote];

        // Optimistic update
        setNotes(updatedNotes);

        // Save to database - JSONB handles the serialization automatically
        const { error: updateError } = await supabase
            .from('happiness_jar')
            .upsert({
                user_id: user.id,
                notes: updatedNotes, // Pass JavaScript array directly
                last_claimed: new Date().toISOString(),
                todays_note: randomNote,
            }, {
                onConflict: 'user_id'
            });

        if (updateError) {
            console.error('Failed to save note:', updateError);
            // Revert optimistic update on error
            setNotes(currentNotes);
            return;
        }

        // Log activity
        await supabase.from('activity_logs').insert({
            user_id: user.id,
            activity: 'Collected a happiness note',
        });
    };

    const getDayResetTime = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const diff = tomorrow.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours === 0 && minutes === 0) return 'less than 1m';
        return `${hours}h ${minutes}m`;
    };

    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadThemeAndData();
            }
        }, [user?.id])
    );

    // Accelerometer subscription
    useEffect(() => {
        _subscribe();
        return () => _unsubscribe();
    }, []);

    // Log visit when component mounts
    useEffect(() => {
        const logVisit = async () => {
            if (user) {
                await supabase.from('activity_logs').insert({
                    user_id: user.id,
                    activity: 'Visited happiness jar',
                });
            }
        };
        logVisit();
    }, [user?.id]);

    // Continuous gentle pulse when not shaking
    useEffect(() => {
        if (todayClaimed || isShaking) return;
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(jarPulse, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
                Animated.timing(jarPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [todayClaimed, isShaking]);

    useEffect(() => {
        if (!isNativeSupported) return;
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();
        if (magnitude > shakeThreshold && now - lastShakeTime.current > 600 && !isShaking && !todayClaimed) {
            lastShakeTime.current = now;
            setShakeCount(prev => prev + 1);
            triggerShake();
        }
    }, [x, y, z, isNativeSupported]);

    useEffect(() => {
        const fillPercent = Math.min(notes.length / 100, 1);
        Animated.spring(fillHeight, {
            toValue: fillPercent * (JAR_HEIGHT * 0.7),
            useNativeDriver: false,
            tension: 30,
            friction: 7,
        }).start();
    }, [notes.length]);

    const fillPercent = Math.min(notes.length / 100, 1);
    const notesToShow = notes.length === 0 ? 3 : Math.max(Math.min(notes.length, 16), 5);

    return (
        <SafeAreaView style={[st.root, { backgroundColor: theme.surfaceBg }]} edges={['top']}>
            {/* Header */}
            <View style={[st.header, { borderBottomColor: theme.cardBorder, backgroundColor: theme.surfaceBg }]}>
                <TouchableOpacity style={[st.backBtn, { backgroundColor: theme.cardBg }]} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={22} color={theme.accentColor} />
                </TouchableOpacity>
                <Text style={[st.headerTitle, { color: theme.accentColor }]}>Happiness Jar</Text>
                <TouchableOpacity style={[st.listBtn, { backgroundColor: theme.cardBg }]} onPress={() => setShowNotesList(true)}>
                    <Ionicons name="list-outline" size={20} color={theme.accentColor} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
                {/* ── Jar Section ── */}
                <View style={st.jarSection}>
                    {/* Sparkles */}
                    <Animated.Text style={[st.sparkle, st.sparkle1, { opacity: sparkle1, color: theme.accentColor }]}>✨</Animated.Text>
                    <Animated.Text style={[st.sparkle, st.sparkle2, { opacity: sparkle2, color: theme.accentColor }]}>✨</Animated.Text>
                    <Animated.Text style={[st.sparkle, st.sparkle3, { opacity: sparkle3, color: theme.accentColor }]}>✨</Animated.Text>

                    {/* Progress ring */}
                    <View style={[st.progressRing, { borderColor: theme.cardBorder }]}>
                        <View style={[st.progressFill, {
                            width: `${fillPercent * 100}%`,
                            backgroundColor: theme.fillColor + '60',
                        }]} />
                    </View>
                    <Text style={[st.progressText, { color: theme.accentColor }]}>
                        {notes.length}/100 · {Math.round(fillPercent * 100)}% full
                    </Text>

                    {/* Jar */}
                    <TouchableOpacity activeOpacity={0.9} onPress={!isNativeSupported ? handleTapShake : undefined}>
                        <Animated.View style={[st.jarWrapper, {
                            transform: [
                                { translateX: jarShake },
                                { scale: Animated.multiply(jarPulse, todayClaimed ? 1 : 1) },
                            ],
                        }]}>
                            {/* Jar body */}
                            <View style={[st.jar, {
                                backgroundColor: theme.cardBg,
                                borderColor: theme.jarColor + '50',
                            }]}>
                                {/* Jar inner glow */}
                                <View style={[st.jarInnerGlow, { backgroundColor: theme.jarGlow }]} />

                                {/* Fill level */}
                                <Animated.View style={[st.jarFill, {
                                    height: fillHeight,
                                    backgroundColor: theme.fillColor + '25',
                                    borderTopColor: theme.fillColor + '40',
                                }]}>
                                    {/* Fill shimmer */}
                                    <View style={[st.fillShimmer, { backgroundColor: theme.fillColor + '10' }]} />
                                </Animated.View>

                                {/* Floating notes */}
                                {FLOATING_POSITIONS.slice(0, notesToShow).map((pos, i) => (
                                    <View key={i} style={[st.floatingNote, {
                                        top: pos.top,
                                        left: pos.left,
                                        backgroundColor: theme.accentColor + (notes.length > 0 ? '20' : '08'),
                                        borderColor: theme.accentColor + (notes.length > 0 ? '35' : '12'),
                                        transform: [
                                            { rotate: `${pos.rotate}deg` },
                                            { scale: pos.scale },
                                        ],
                                    }]}>
                                        <Text style={[st.floatingNoteText, { color: theme.accentColor }]}>
                                            {notes.length > 0 ? theme.noteEmoji : '📝'}
                                        </Text>
                                    </View>
                                ))}

                                {/* Jar label */}
                                <View style={[st.jarLabel, { backgroundColor: theme.labelBg + 'E0' }]}>
                                    <Text style={[st.jarLabelText, { color: theme.accentColor }]}>
                                        {theme.noteEmoji} {notes.length}
                                    </Text>
                                </View>

                                {/* Shake/Tap hint */}
                                {!todayClaimed && !isShaking && (
                                    <View style={st.shakeHint}>
                                        <Ionicons
                                            name={isNativeSupported ? "phone-portrait-outline" : "hand-left-outline"}
                                            size={14}
                                            color={theme.accentColor + '70'}
                                        />
                                        <Text style={[st.shakeHintText, { color: theme.accentColor + '70' }]}>
                                            {isNativeSupported ? 'Shake me!' : 'Tap me!'}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Jar lid */}
                            <View style={[st.jarLid, {
                                backgroundColor: theme.lidColor,
                                borderColor: theme.jarColor + '60',
                            }]}>
                                <View style={[st.jarLidHighlight, { backgroundColor: theme.jarColor + '30' }]} />
                                <View style={[st.jarLidKnob, { backgroundColor: theme.jarColor + '80' }]} />
                            </View>

                            {/* Jar base */}
                            <View style={[st.jarBase, {
                                backgroundColor: theme.lidColor,
                                borderColor: theme.jarColor + '50',
                            }]}>
                                <View style={[st.jarBaseHighlight, { backgroundColor: theme.jarColor + '20' }]} />
                            </View>
                        </Animated.View>
                    </TouchableOpacity>

                    {/* Shake counter */}
                    {!todayClaimed && shakeCount > 0 && (
                        <View style={[st.shakeCounter, { backgroundColor: theme.accentColor + '15', borderColor: theme.accentColor + '30' }]}>
                            {[0, 1, 2].map((dot) => (
                                <View key={dot} style={[
                                    st.shakeDot,
                                    { backgroundColor: dot < shakeCount ? theme.accentColor : theme.accentColor + '20' },
                                ]} />
                            ))}
                            <Text style={[st.shakeCounterText, { color: theme.accentColor }]}>
                                {3 - shakeCount} more {isNativeSupported ? 'shake' : 'tap'}{3 - shakeCount !== 1 ? 's' : ''}
                            </Text>
                        </View>
                    )}

                    {/* Already claimed toast */}
                    {alreadyClaimedMessage && (
                        <Animated.View style={[st.alreadyClaimedMsg, {
                            backgroundColor: theme.accentColor + '10',
                            borderColor: theme.accentColor + '25',
                            opacity: messageOpacity,
                        }]}>
                            <Ionicons name="time-outline" size={14} color={theme.accentColor} />
                            <Text style={[st.alreadyClaimedText, { color: theme.accentColor }]}>
                                Already claimed! Come back in {getDayResetTime()}
                            </Text>
                        </Animated.View>
                    )}
                </View>

                {/* ── Today's Note Card ── */}
                {showNote && todaysNote && (
                    <Animated.View style={[st.noteCard, {
                        backgroundColor: theme.cardBg,
                        borderColor: theme.accentColor + '30',
                        opacity: noteOpacity,
                        transform: [{ translateY: noteSlide }],
                    }]}>
                        <View style={[st.noteCardRibbon, { backgroundColor: theme.accentColor }]} />
                        <CornerAccent shape="circle" color={theme.accentColor} size={8} />
                        <View style={[st.noteEmojiCircle, { backgroundColor: theme.accentColor + '15', borderColor: theme.accentColor + '30' }]}>
                            <Text style={st.noteEmojiLarge}>{theme.noteEmoji}</Text>
                        </View>
                        <Text style={[st.noteText, { color: theme.accentColor }]}>{todaysNote}</Text>
                        <Text style={st.noteSubtext}>Today's happiness ✨</Text>
                    </Animated.View>
                )}

                {/* ── Claimed Status ── */}
                {todayClaimed && (
                    <View style={[st.claimedCard, { backgroundColor: theme.cardBg, borderColor: theme.accentColor + '20' }]}>
                        <View style={[st.claimedDot, { backgroundColor: theme.accentColor }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={[st.claimedTitle, { color: theme.accentColor }]}>Note collected!</Text>
                            <Text style={st.claimedSubtext}>Come back in {getDayResetTime()} for another</Text>
                        </View>
                        <Text style={[st.claimedIcon, { color: theme.accentColor }]}>{theme.noteEmoji}</Text>
                    </View>
                )}

                {/* ── Info Card ── */}
                <View style={[st.infoCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                    <View style={st.infoRow}>
                        <Text style={st.infoIcon}>🫙</Text>
                        <Text style={st.infoText}>
                            {isNativeSupported ? 'Shake your phone' : 'Tap the jar'} 3 times to reveal a happy note!
                        </Text>
                    </View>
                    <View style={[st.infoDivider, { backgroundColor: theme.cardBorder }]} />
                    <View style={st.infoRow}>
                        <Text style={st.infoIcon}>📅</Text>
                        <Text style={st.infoSubtext}>One note per day · {100 - notes.length} until jar is full</Text>
                    </View>
                </View>
            </ScrollView>

            {/* ── Notes List Modal ── */}
            <Modal visible={showNotesList} transparent animationType="fade" onRequestClose={() => setShowNotesList(false)}>
                <View style={st.modalOverlay}>
                    <View style={[st.modalBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                        <View style={st.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={st.modalHeaderEmoji}>{theme.noteEmoji}</Text>
                                <Text style={[st.modalTitle, { color: theme.accentColor }]}>
                                    Your Notes ({notes.length})
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowNotesList(false)}>
                                <Ionicons name="close" size={22} color={Colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={st.notesScroll} showsVerticalScrollIndicator={false}>
                            {notes.length === 0 ? (
                                <View style={st.emptyNotes}>
                                    <Text style={st.emptyNotesEmoji}>🫙</Text>
                                    <Text style={st.noNotesText}>
                                        No notes yet.{'\n'}{isNativeSupported ? 'Shake' : 'Tap'} the jar to collect some!
                                    </Text>
                                </View>
                            ) : (
                                notes.slice().reverse().map((noteObj, i) => (
                                    <View key={i} style={[st.noteItem, { borderBottomColor: theme.cardBorder }]}>
                                        <View style={[st.noteItemBadge, { backgroundColor: theme.accentColor + '15' }]}>
                                            <Text style={st.noteItemEmoji}>{theme.noteEmoji}</Text>
                                        </View>
                                        <View style={st.noteItemContent}>
                                            <Text style={st.noteItemText}>{noteObj.note}</Text>
                                            <Text style={st.noteItemDate}>
                                                {new Date(noteObj.collected_at).toLocaleDateString('en-PH', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </Text>
                                        </View>
                                        <Text style={st.noteItemNum}>#{notes.length - i}</Text>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const CornerAccent = ({ shape, color, size = 14 }: { shape: string; color: string; size?: number }) => {
    if (shape === 'circle') {
        return <View style={{ position: 'absolute', top: 8, right: 8, width: size, height: size, borderRadius: size / 2, backgroundColor: color + '25', borderWidth: 1, borderColor: color + '40' }} />;
    }
    return <View style={{ position: 'absolute', top: 8, right: 8, width: size, height: size, backgroundColor: color + '25', borderRadius: 2, borderWidth: 1, borderColor: color + '30', transform: [{ rotate: '45deg' }] }} />;
};

const st = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1 },
    backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    listBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    scroll: { paddingHorizontal: 16, paddingBottom: 40, alignItems: 'center' },

    // ── Jar Section ──
    jarSection: { width: '100%', alignItems: 'center', marginTop: 24, marginBottom: 20, position: 'relative' },

    // Progress ring
    progressRing: { width: JAR_SIZE + 20, height: 4, borderRadius: 2, borderWidth: 1, marginBottom: 6, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 2 },
    progressText: { fontSize: 10, fontWeight: '500', marginBottom: 12 },

    // Jar wrapper (lid + body + base)
    jarWrapper: { alignItems: 'center' },

    // Lid
    jarLid: {
        width: JAR_SIZE * 0.85,
        height: 18,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderWidth: 2,
        borderBottomWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: -2,
        zIndex: 2,
    },
    jarLidHighlight: {
        position: 'absolute',
        top: 2,
        left: '20%',
        right: '20%',
        height: 3,
        borderRadius: 2,
    },
    jarLidKnob: {
        width: 24,
        height: 10,
        borderRadius: 5,
        marginTop: -4,
    },

    // Jar body
    jar: {
        width: JAR_SIZE,
        height: JAR_HEIGHT,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 1,
    },
    jarInnerGlow: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    },
    jarFill: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
        borderTopWidth: 1,
    },
    fillShimmer: {
        position: 'absolute',
        top: 4, left: '20%', right: '20%',
        height: '40%',
        borderRadius: 20,
    },

    // Jar base
    jarBase: {
        width: JAR_SIZE * 0.9,
        height: 10,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        borderWidth: 2,
        borderTopWidth: 0,
        marginTop: -2,
        zIndex: 0,
    },
    jarBaseHighlight: {
        position: 'absolute',
        top: 1,
        left: '25%',
        right: '25%',
        height: 2,
        borderRadius: 1,
    },

    // Floating notes
    floatingNote: {
        position: 'absolute',
        width: 30,
        height: 22,
        borderRadius: 5,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
    },
    floatingNoteText: { fontSize: 11 },

    // Jar label
    jarLabel: {
        position: 'absolute',
        bottom: 8,
        alignSelf: 'center',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 12,
        zIndex: 4,
    },
    jarLabelText: { fontSize: 12, fontWeight: '700' },

    // Shake hint
    shakeHint: {
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    shakeHintText: { fontSize: 11, fontWeight: '500' },

    // Sparkles
    sparkle: { position: 'absolute', fontSize: 22, zIndex: 10 },
    sparkle1: { top: 10, left: '15%' },
    sparkle2: { top: 50, right: '10%' },
    sparkle3: { top: 80, left: '12%' },

    // Shake counter
    shakeCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    shakeDot: { width: 10, height: 10, borderRadius: 5 },
    shakeCounterText: { fontSize: 12, fontWeight: '600' },

    // Already claimed toast
    alreadyClaimedMsg: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    alreadyClaimedText: { fontSize: 11, fontWeight: '500' },

    // ── Note Card ──
    noteCard: {
        width: '100%',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    noteCardRibbon: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
    },
    noteEmojiCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    noteEmojiLarge: { fontSize: 24 },
    noteText: { fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
    noteSubtext: { color: Colors.textMuted, fontSize: 11, marginTop: 8 },

    // ── Claimed Card ──
    claimedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        width: '100%',
        marginBottom: 16,
    },
    claimedDot: { width: 10, height: 10, borderRadius: 5 },
    claimedTitle: { fontSize: 13, fontWeight: '600' },
    claimedSubtext: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
    claimedIcon: { fontSize: 20 },

    // ── Info Card ──
    infoCard: { borderRadius: 12, padding: 14, borderWidth: 1, width: '100%', marginBottom: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoIcon: { fontSize: 18 },
    infoText: { color: Colors.textSecondary, fontSize: 12, flex: 1 },
    infoSubtext: { color: Colors.textMuted, fontSize: 11, flex: 1 },
    infoDivider: { height: 1, marginVertical: 10 },

    // ── Modal ──
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
    modalBox: { borderRadius: 16, padding: 20, width: '90%', maxHeight: height * 0.7, borderWidth: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalHeaderEmoji: { fontSize: 20 },
    modalTitle: { fontSize: 16, fontWeight: '700' },
    notesScroll: { maxHeight: height * 0.5 },
    emptyNotes: { alignItems: 'center', padding: 30 },
    emptyNotesEmoji: { fontSize: 40, marginBottom: 10 },
    noNotesText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
    noteItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
    noteItemBadge: {
        width: 32, height: 32, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
    },
    noteItemEmoji: { fontSize: 14 },
    noteItemText: { flex: 1, color: Colors.textPrimary, fontSize: 12, lineHeight: 18 },
    noteItemNum: { color: Colors.textMuted, fontSize: 10, fontWeight: '500' },
    noteItemContent: { flex: 1 },
    noteItemDate: { color: Colors.textMuted, fontSize: 9, marginTop: 2 },
});