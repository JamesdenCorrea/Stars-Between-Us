import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl,
    Animated, Dimensions, Switch, Modal, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');
const MENU_WIDTH = Math.min(width * 0.78, 320);

const PETS: Record<string, string> = {
    bear: '🐻', bunny: '🐰', cat: '🐱', dog: '🐶', fox: '🦊', panda: '🐼',
};

const PET_TYPES = Object.keys(PETS);

type ActivityLog = {
    id?: string;
    user_id: string;
    activity: string;
    created_at: string;
    actorName?: string;
};

// ── Theme System ──
type ThemeName = 'night_sky' | 'girlie' | 'nature' | 'gamer';

interface ThemeConfig {
    name: string;
    label: string;
    accentColor: string;
    accentGlow: string;
    accentMuted: string;
    cornerShape: 'diamond' | 'circle' | 'triangle' | 'square';
    description: string;
    cardBg: string;
    cardBorder: string;
    surfaceBg: string;
    surfaceBorder: string;
    bgGradient: string;
    auditColor: string;
    auditGlow: string;
    auditBorder: string;
    journeyEmoji: string;
    journeyTimeEmoji: string;
    featureIcons: string[];
    emptyEmoji: string;
}

const THEMES: Record<ThemeName, ThemeConfig> = {
    night_sky: {
        name: 'Night Sky',
        label: 'Cosmic & dreamy',
        accentColor: Colors.yellow,
        accentGlow: Colors.yellowGlow,
        accentMuted: Colors.yellow + '20',
        cornerShape: 'diamond',
        description: 'Warm gold accents on deep space',
        cardBg: '#1A1A2E',
        cardBorder: '#2A2A4E',
        surfaceBg: '#16213E',
        surfaceBorder: '#252545',
        bgGradient: 'linear',
        auditColor: '#34D399',
        auditGlow: '#34D39920',
        auditBorder: '#34D39930',
        journeyEmoji: '✨',
        journeyTimeEmoji: '⏱',
        featureIcons: ['💌', '📬', '🫙', '🐾', '✦', '📋'],
        emptyEmoji: '✦',
    },
    girlie: {
        name: 'Blossom',
        label: 'Soft & floral',
        accentColor: '#F472B6',
        accentGlow: '#F472B620',
        accentMuted: '#F472B620',
        cornerShape: 'circle',
        description: 'Gentle pink with rounded corners',
        cardBg: '#2D1B2E',
        cardBorder: '#3D2840',
        surfaceBg: '#261828',
        surfaceBorder: '#352235',
        bgGradient: 'soft',
        auditColor: '#F9A8D4',
        auditGlow: '#F9A8D420',
        auditBorder: '#F9A8D430',
        journeyEmoji: '💕',
        journeyTimeEmoji: '🕊️',
        featureIcons: ['💖', '🎀', '🌸', '🦋', '💝', '💋'],
        emptyEmoji: '🌸',
    },
    nature: {
        name: 'Evergreen',
        label: 'Fresh & organic',
        accentColor: '#34D399',
        accentGlow: '#34D39920',
        accentMuted: '#34D39920',
        cornerShape: 'triangle',
        description: 'Earthy green with natural shapes',
        cardBg: '#1A2E23',
        cardBorder: '#254535',
        surfaceBg: '#15261E',
        surfaceBorder: '#1F3D2F',
        bgGradient: 'leaf',
        auditColor: '#6EE7B7',
        auditGlow: '#6EE7B720',
        auditBorder: '#6EE7B730',
        journeyEmoji: '🌿',
        journeyTimeEmoji: '🌱',
        featureIcons: ['🌺', '🍀', '🌻', '🦊', '⭐', '🐝'],
        emptyEmoji: '🌿',
    },
    gamer: {
        name: 'Neon Arcade',
        label: 'Retro & electric',
        accentColor: '#A78BFA',
        accentGlow: '#A78BFA20',
        accentMuted: '#A78BFA20',
        cornerShape: 'square',
        description: 'Vibrant purple with pixel vibes',
        cardBg: '#1E1B3A',
        cardBorder: '#2E2A52',
        surfaceBg: '#181535',
        surfaceBorder: '#272350',
        bgGradient: 'grid',
        auditColor: '#C4B5FD',
        auditGlow: '#C4B5FD20',
        auditBorder: '#C4B5FD30',
        journeyEmoji: '🎮',
        journeyTimeEmoji: '⚡',
        featureIcons: ['🎯', '💎', '🔥', '👾', '🌟', '💫'],
        emptyEmoji: '👾',
    },
};

const FEATURES = [
    { id: 'daily', label: 'Daily Message', route: '/(app)/daily-message' },
    { id: 'openwhen', label: 'Open When...', route: '/(app)/open-when' },
    { id: 'jar', label: 'Happiness Jar', route: '/(app)/happiness-jar' },
    { id: 'pet', label: 'Pet Companion', route: '/(app)/pet' },
    { id: 'stars', label: 'Stars Between Us', route: '/(app)/stars' },
    { id: 'wall', label: 'Activity Wall', route: '/(app)/activity-wall' },
];

// Corner accent component
const CornerAccent = ({ shape, color, size = 14 }: { shape: string; color: string; size?: number }) => {
    if (shape === 'diamond') {
        return <View style={{ width: size, height: size, backgroundColor: color + '30', transform: [{ rotate: '45deg' }], borderRadius: 2 }} />;
    }
    if (shape === 'circle') {
        return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '25', borderWidth: 1, borderColor: color + '40' }} />;
    }
    if (shape === 'triangle') {
        return <View style={{ width: 0, height: 0, borderLeftWidth: size / 2, borderRightWidth: size / 2, borderBottomWidth: size, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color + '25' }} />;
    }
    return <View style={{ width: size, height: size, backgroundColor: color + '25', borderRadius: 2, borderWidth: 1, borderColor: color + '30' }} />;
};

export default function DashboardScreen() {

    const { session } = useAuth();
    const user = session?.user;
    const router = useRouter();

    const [menuOpen, setMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'statistics'>('profile');
    const [profile, setProfile] = useState<any>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [notifEnabled, setNotifEnabled] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [daysSince, setDaysSince] = useState<any>(null);
    const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
    const [partnerInfo, setPartnerInfo] = useState<{ name: string; inviteCode: string } | null>(null);

    const [currentTheme, setCurrentTheme] = useState<ThemeName>('night_sky');
    const theme = THEMES[currentTheme];

    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editDisplayName, setEditDisplayName] = useState('');
    const [editPetType, setEditPetType] = useState('bear');
    const [showPetPicker, setShowPetPicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);

    const menuAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;
    // Add this state after the other useState declarations (around line 170)
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState<{ name: string; icon: string; message: string } | null>(null);

    // Cute coming soon messages for each feature
    const getComingSoonMessage = (featureId: string, idx: number) => {
        const icon = theme.featureIcons[idx];
        const messages: Record<string, { title: string; msg: string; emoji: string }> = {
            daily: {
                title: 'Daily Message',
                msg: 'A sweet message just for you, delivered fresh every morning like warm cookies! Our little mail carriers are working hard to bring you daily joy.',
                emoji: '🍪',
            },
            openwhen: {
                title: 'Open When...',
                msg: 'Secret letters sealed with love, waiting for the perfect moment. Open when you need a smile, a hug, or a reminder that someone cares.',
                emoji: '✉️',
            },
            pet: {
                title: 'Pet Companion',
                msg: 'A fluffy friend is getting ready to move in! Feed them, play with them, and watch them grow. Adoption papers are being processed!',
                emoji: '🐾',
            },
            stars: {
                title: 'Stars Between Us',
                msg: 'A constellation of memories connecting two hearts across the universe. The stars are aligning — this feature will shine soon!',
                emoji: '🌌',
            },
            wall: {
                title: 'Activity Wall',
                msg: 'A shared canvas where every moment becomes a masterpiece. Pin your favorite memories and watch your love story unfold.',
                emoji: '🎨',
            },
        };
        return messages[featureId] || { title: 'Coming Soon', msg: 'Something magical is brewing! Our little helpers are sprinkling extra love on this feature.', emoji: '🪄' };
    };
    const calculateDaysSince = (createdAt: string) => {
        const created = new Date(createdAt);
        const now = new Date();
        let y = now.getFullYear() - created.getFullYear();
        let mo = now.getMonth() - created.getMonth();
        let d = now.getDate() - created.getDate();
        let h = now.getHours() - created.getHours();
        let mi = now.getMinutes() - created.getMinutes();
        let s = now.getSeconds() - created.getSeconds();
        if (s < 0) { s += 60; mi--; }
        if (mi < 0) { mi += 60; h--; }
        if (h < 0) { h += 24; d--; }
        if (d < 0) { d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); mo--; }
        if (mo < 0) { mo += 12; y--; }
        const totalDays = Math.floor((now.getTime() - created.getTime()) / 86400000);
        return { years: y, months: mo, days: d, hours: h, minutes: mi, seconds: s, totalDays };
    };

    const fetchProfile = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
            setProfile(data);
            setSoundEnabled(data.sound_effects ?? true);
            setNotifEnabled(data.notification_enabled ?? true);
            setEditDisplayName(data.display_name || '');
            setEditPetType(data.pet_type || 'bear');
            if (data.theme && THEMES[data.theme as ThemeName]) {
                setCurrentTheme(data.theme as ThemeName);
            }
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchRecentActivities();
        setRefreshing(false);
    }, [user?.id, profile?.partner_id]);

    const fetchRecentActivities = async () => {
        if (!user) return;

        const userIds = [user.id];
        if (profile?.partner_id) userIds.push(profile.partner_id);

        const { data, error } = await supabase
            .from('activity_logs').select('*').in('user_id', userIds)
            .order('created_at', { ascending: false }).limit(5);

        if (error) {
            console.log('Error fetching activities:', error.message);
            return;
        }

        const profileNames = new Map<string, string>();
        if (data?.length) {
            const { data: activityProfiles } = await supabase
                .from('profiles')
                .select('id, display_name')
                .in('id', [...new Set(data.map((activity) => activity.user_id))]);

            activityProfiles?.forEach((activityProfile) => {
                profileNames.set(activityProfile.id, activityProfile.display_name);
            });
        }

        if (data) {
            const activities = data.map((activity) => ({
                ...activity,
                actorName: activity.user_id === user.id
                    ? 'You'
                    : profileNames.get(activity.user_id) ?? 'Partner',
            }));
            setRecentActivities(activities);
        } else {
            console.log('No activities found or data is null');
        }
    };

    const fetchPartnerInfo = async (partnerId: string) => {
        const { data } = await supabase.from('profiles')
            .select('display_name, invite_code').eq('id', partnerId).single();
        if (data) setPartnerInfo({ name: data.display_name, inviteCode: data.invite_code });
    };

    const logActivity = async (activity: string) => {
        if (!user) return;
        const { error } = await supabase.from('activity_logs').insert({ user_id: user.id, activity: activity });
        if (!error) {
            fetchRecentActivities();
            setTimeout(fetchRecentActivities, 500);
        }
    };

    const handleThemeChange = async (themeName: ThemeName) => {
        setCurrentTheme(themeName);
        setShowThemePicker(false);
        if (user) {
            await supabase.from('profiles').update({ theme: themeName }).eq('id', user.id);
            await logActivity(`Changed theme to ${THEMES[themeName].name}`);
        }
    };

    useEffect(() => { if (user) fetchProfile(); }, [user]);

    // Real-time subscription for activity logs
    useEffect(() => {
        if (!user) return;
        
        const channel = supabase
            .channel('activity-updates')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'activity_logs' },
                () => {
                    fetchRecentActivities();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, profile?.partner_id]);



    // Refresh data when screen comes into focus (navigating back from features)
    useFocusEffect(
        useCallback(() => {
            // Always fetch recent activities when dashboard comes into focus
            if (user) {
                fetchRecentActivities();
            }
    }, [user?.id, profile?.partner_id])
    );

    useEffect(() => {
        if (profile) {
            fetchRecentActivities();
            if (profile.partner_id) fetchPartnerInfo(profile.partner_id);
        }
    }, [profile?.id, profile?.partner_id]);

    useEffect(() => {
        if (!profile?.created_at) return;
        const timer = setInterval(() => {
            setCurrentTime(new Date());
            setDaysSince(calculateDaysSince(profile.created_at));
        }, 1000);
        return () => clearInterval(timer);
    }, [profile?.created_at]);

    const openMenu = () => {
        setMenuOpen(true);
        Animated.parallel([
            Animated.spring(menuAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
            Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
    };

    const closeMenu = () => {
        Animated.parallel([
            Animated.spring(menuAnim, { toValue: -MENU_WIDTH, useNativeDriver: true, tension: 65, friction: 11 }),
            Animated.timing(overlayAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => setMenuOpen(false));
    };

    const confirmLogout = async () => {
        setShowLogoutModal(false);
        closeMenu();
        await logActivity('Logged out');
        setTimeout(async () => { await supabase.auth.signOut(); }, 500);
    };

    const handleSaveProfile = async () => {
        if (!editDisplayName.trim()) {
            Alert.alert('Invalid', 'Display name cannot be empty.');
            return;
        }
        setSaving(true);
        const changes: string[] = [];
        const oldName = profile?.display_name || '';
        const oldPet = profile?.pet_type || 'bear';
        if (editDisplayName.trim() !== oldName) changes.push(`name to "${editDisplayName.trim()}"`);
        if (editPetType !== oldPet) changes.push(`pet to ${PETS[editPetType]} ${editPetType}`);
        const { error } = await supabase
            .from('profiles')
            .update({ display_name: editDisplayName.trim(), pet_type: editPetType })
            .eq('id', user?.id);
        if (error) {
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } else {
            setProfile((prev: any) => ({ ...prev, display_name: editDisplayName.trim(), pet_type: editPetType }));
            setShowEditProfile(false);
            if (changes.length > 0) await logActivity(`Updated profile: ${changes.join(', ')}`);
        }
        setSaving(false);
    };

    const handleToggleNotification = async (value: boolean) => {
        setNotifEnabled(value);
        await supabase.from('profiles').update({ notification_enabled: value }).eq('id', user?.id);
        await logActivity(`${value ? 'Enabled' : 'Disabled'} notifications`);
    };

    const handleToggleSound = async (value: boolean) => {
        setSoundEnabled(value);
        await supabase.from('profiles').update({ sound_effects: value }).eq('id', user?.id);
        await logActivity(`${value ? 'Enabled' : 'Disabled'} sound effects`);
    };

    const displayName = profile?.display_name ?? user?.user_metadata?.display_name ?? 'Stargazer';
    const petType = profile?.pet_type ?? user?.user_metadata?.pet_type ?? 'bear';
    const petEmoji = PETS[petType] ?? '🐻';

    const journeyLabel = daysSince
        ? [
            daysSince.years > 0 && `${daysSince.years}y`,
            daysSince.months > 0 && `${daysSince.months}mo`,
            daysSince.days > 0 && `${daysSince.days}d`,
            `${daysSince.hours}h`, `${daysSince.minutes}m`, `${daysSince.seconds}s`,
        ].filter(Boolean).join(' ')
        : null;

    return (
        <>
          <Head>
            <title>Dashboard | Stars Between Us</title>
          </Head>
        <View style={[s.root, { backgroundColor: theme.surfaceBg }]}>
            <SafeAreaView style={s.container} edges={['top']}>
                {/* Header */}
                <View style={[s.header, { borderBottomColor: theme.accentColor + '25', backgroundColor: theme.surfaceBg }]}>
                    <TouchableOpacity style={[s.burgerBtn, { backgroundColor: theme.cardBg }]} onPress={openMenu}>
                        <Ionicons name="menu" size={22} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={s.headerCenter}>
                        <View style={[s.headerAccent, { backgroundColor: theme.accentColor }]} />
                        <Text style={s.headerTitle}>Stars Between Us</Text>
                    </View>
                    <View style={[s.petBadge, { borderColor: theme.accentColor + '50', backgroundColor: theme.cardBg }]}>
                        <Text style={s.petBadgeEmoji}>{petEmoji}</Text>
                    </View>
                </View>

                <ScrollView 
                    contentContainerStyle={s.scroll} 
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh}
                            tintColor={theme.accentColor}
                            colors={[theme.accentColor]}
                        />
                    }>
                    {/* Welcome Card */}
                    <View style={[s.welcomeCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                        <View style={[s.cardCornerTL, { backgroundColor: theme.accentColor + '10', borderColor: theme.accentColor + '30' }]}>
                            <CornerAccent shape={theme.cornerShape} color={theme.accentColor} size={10} />
                        </View>
                        <View style={{ flex: 1, zIndex: 1 }}>
                            <Text style={s.welcomeGreeting}>Good day,</Text>
                            <Text style={[s.welcomeName, { color: theme.accentColor }]}>{displayName}</Text>
                            <Text style={s.welcomeSub}>Your universe is waiting</Text>
                        </View>
                        <Text style={s.welcomePet}>{petEmoji}</Text>
                    </View>

                    {/* Journey Card */}
                    {daysSince && (
                        <View style={[s.journeyCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                            <View style={[s.cardCornerTR, { backgroundColor: theme.accentColor + '08', borderColor: theme.accentColor + '20' }]}>
                                <CornerAccent shape={theme.cornerShape} color={theme.accentColor} size={8} />
                            </View>
                            <View style={s.journeyRow}>
                                <View style={s.journeyBlock}>
                                    <Text style={s.journeyEmoji}>{theme.journeyEmoji}</Text>
                                    <Text style={s.journeyBlockLabel}>Together</Text>
                                    <Text style={[s.journeyBlockValue, { color: theme.accentColor }]}>{daysSince.totalDays}d</Text>
                                </View>
                                <View style={[s.journeyDivider, { backgroundColor: theme.cardBorder }]} />
                                <View style={s.journeyBlock}>
                                    <Text style={s.journeyEmoji}>{theme.journeyTimeEmoji}</Text>
                                    <Text style={s.journeyBlockLabel}>Journey</Text>
                                    <Text style={[s.journeyTime, { color: theme.accentColor }]}>{journeyLabel}</Text>
                                </View>
                            </View>
                            <Text style={s.journeyDate}>
                                {currentTime.toLocaleString('en-PH', {
                                    timeZone: 'Asia/Manila', weekday: 'short', month: 'short',
                                    day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
                                })}
                            </Text>
                        </View>
                    )}

                    {/* Partner Card */}
                    {partnerInfo && (
                        <View style={[s.partnerCard, { backgroundColor: Colors.red + '10', borderColor: Colors.red + '30' }]}>
                            <View style={s.partnerDot} />
                            <Ionicons name="heart" size={12} color={Colors.red} />
                            <Text style={s.partnerText}>
                                Connected with <Text style={s.partnerName}>{partnerInfo.name}</Text>
                            </Text>
                        </View>
                    )}

                    {/* Features Section */}
                    <View style={s.sectionRow}>
                        <View style={[s.sectionBar, { backgroundColor: theme.accentColor }]} />
                        <Text style={s.sectionLabel}>Your Features</Text>
                    </View>
                    <View style={s.featuresGrid}>
                        {FEATURES.map((f, idx) => (
                            <TouchableOpacity key={f.id} style={[s.featureCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]} activeOpacity={0.75}
                                onPress={() => {
                                    if (f.id === 'jar') {
                                        // Happiness Jar is ready!
                                        router.push(f.route as any);
                                    } else {
                                        // Show cute coming soon modal
                                        const info = getComingSoonMessage(f.id, idx);
                                        setSelectedFeature({ name: info.title, icon: info.emoji, message: info.msg });
                                        setShowComingSoon(true);
                                    }
                                }}>
                                <View style={[s.featureIconBg, { backgroundColor: theme.accentColor + '15' }]}>
                                    <Text style={s.featureIcon}>{theme.featureIcons[idx]}</Text>
                                </View>
                                <Text style={s.featureLabel}>{f.label}</Text>
                                <View style={s.featureTrail}>
                                    <View style={[s.trailDot, { backgroundColor: theme.accentColor + '30' }]} />
                                    <Ionicons name="chevron-forward" size={12} color={Colors.textMuted} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Activity Section */}
                    <View style={s.sectionRow}>
                        <View style={[s.sectionBar, { backgroundColor: theme.accentColor }]} />
                        <Text style={s.sectionLabel}>Recent Activity</Text>
                    </View>
                    {recentActivities.length === 0 ? (
                        <View style={[s.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                            <View style={[s.emptyIconCircle, { borderColor: theme.accentColor + '30' }]}>
                                <Text style={[s.emptyIcon, { color: theme.accentColor }]}>{theme.emptyEmoji}</Text>
                            </View>
                            <Text style={s.emptyText}>No activity yet</Text>
                            <Text style={s.emptySubtext}>Your journey starts here</Text>
                        </View>
                    ) : (
                        <View style={s.activityList}>
                            {recentActivities.map((a, i) => {
                                const isAudit = a.activity?.includes('Logged in') ||
                                    a.activity?.includes('Updated profile') ||
                                    a.activity?.includes('Enabled') ||
                                    a.activity?.includes('Disabled') ||
                                    a.activity?.includes('Logged out') ||
                                    a.activity?.includes('Changed theme') ||
                                    a.activity?.includes('Collected a happiness note') ||
                                    a.activity?.includes('Visited happiness jar');
                                return (
                                    <View key={i} style={[s.activityItem, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                                        <View style={[
                                            s.activityDot,
                                            { backgroundColor: isAudit ? theme.auditColor : theme.accentColor }
                                        ]} />
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Text style={s.activityText}>
                                                    <Text style={[s.activityActor, { color: theme.accentColor }]}>{a.actorName}: </Text>
                                                    {a.activity}
                                                </Text>
                                                {isAudit && (
                                                    <View style={[s.auditBadge, {
                                                        backgroundColor: theme.auditGlow,
                                                        borderColor: theme.auditBorder
                                                    }]}>
                                                        <Text style={[s.auditBadgeText, { color: theme.auditColor }]}>sys</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={s.activityTime}>
                                                {new Date(a.created_at).toLocaleString('en-PH', {
                                                    timeZone: 'Asia/Manila', month: 'short', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit',
                                                })}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Footer accent */}
                    <View style={s.footerRow}>
                        <View style={[s.footerLine, { backgroundColor: theme.accentColor + '20' }]} />
                        <View style={[s.footerShape, { borderColor: theme.accentColor + '40' }]}>
                            <CornerAccent shape={theme.cornerShape} color={theme.accentColor} size={8} />
                        </View>
                        <View style={[s.footerLine, { backgroundColor: theme.accentColor + '20' }]} />
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Overlay */}
            {menuOpen && (
                <Animated.View style={[s.overlay, { opacity: overlayAnim }]}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={closeMenu} activeOpacity={1} />
                </Animated.View>
            )}

            {/* Drawer */}
            <Animated.View style={[s.drawer, { backgroundColor: theme.cardBg, borderRightColor: theme.cardBorder, transform: [{ translateX: menuAnim }] }]}>
                <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                    <View style={[s.drawerHeader, { borderBottomColor: theme.cardBorder }]}>
                        <TouchableOpacity style={s.closeBtn} onPress={closeMenu}>
                            <Ionicons name="close" size={20} color={Colors.textMuted} />
                        </TouchableOpacity>
                        <View style={[s.drawerAvatar, { backgroundColor: theme.surfaceBg, borderColor: theme.accentColor }]}>
                            <Text style={s.drawerAvatarEmoji}>{petEmoji}</Text>
                        </View>
                        <Text style={s.drawerName}>{displayName}</Text>
                        <Text style={s.drawerEmail} numberOfLines={1}>{user?.email}</Text>
                        {partnerInfo && (
                            <View style={[s.partnerBadge, { backgroundColor: Colors.red + '10', borderColor: Colors.red + '30' }]}>
                                <Ionicons name="heart" size={9} color={Colors.red} />
                                <Text style={s.partnerBadgeText}>{partnerInfo.name}</Text>
                            </View>
                        )}
                    </View>

                    <View style={[s.tabs, { borderBottomColor: theme.cardBorder }]}>
                        {(['profile', 'settings', 'statistics'] as const).map((tab) => (
                            <TouchableOpacity key={tab}
                                style={[s.tab, activeTab === tab && [s.tabActive, { borderBottomColor: theme.accentColor }]]}
                                onPress={() => setActiveTab(tab)}>
                                <Text style={[s.tabText, activeTab === tab && [s.tabTextActive, { color: theme.accentColor }]]}>
                                    {tab === 'statistics' ? 'Stats' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        {activeTab === 'profile' && (
                            <View style={s.tabContent}>
                                <DRow label="Name" value={displayName} borderColor={theme.cardBorder} />
                                <DRow label="Pet" value={`${petEmoji} ${petType.charAt(0).toUpperCase() + petType.slice(1)}`} borderColor={theme.cardBorder} />
                                <DRow label="Invite Code" value={profile?.invite_code ?? '——'} highlight themeColor={theme.accentColor} borderColor={theme.cardBorder} />
                                {partnerInfo && <DRow label="Partner" value={partnerInfo.name} borderColor={theme.cardBorder} />}
                                <TouchableOpacity
                                    style={[s.editBtn, { backgroundColor: theme.accentGlow, borderColor: theme.accentColor + '40' }]}
                                    onPress={() => {
                                        setEditDisplayName(displayName);
                                        setEditPetType(petType);
                                        setShowEditProfile(true);
                                    }}
                                >
                                    <Ionicons name="create-outline" size={14} color={theme.accentColor} />
                                    <Text style={[s.editBtnText, { color: theme.accentColor }]}>Edit Profile</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {activeTab === 'settings' && (
                            <View style={s.tabContent}>
                                {[
                                    { label: 'Notifications', value: notifEnabled, onChange: handleToggleNotification },
                                    { label: 'Sound Effects', value: soundEnabled, onChange: handleToggleSound },
                                ].map((item) => (
                                    <View key={item.label} style={[s.settingRow, { borderBottomColor: theme.cardBorder }]}>
                                        <Text style={s.settingLabel}>{item.label}</Text>
                                        <Switch value={item.value} onValueChange={item.onChange}
                                            trackColor={{ false: theme.surfaceBg, true: theme.accentColor + '50' }}
                                            thumbColor={item.value ? theme.accentColor : Colors.black} />
                                    </View>
                                ))}
                                <View style={[s.settingRow, { borderBottomColor: theme.cardBorder }]}>
                                    <Text style={s.settingLabel}>Calendar Color</Text>
                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                        {['#FFD700', '#A78BFA', '#34D399', '#60A5FA'].map(c => (
                                            <TouchableOpacity key={c}
                                                style={[s.colorDot, { backgroundColor: c },
                                                profile?.calendar_color === c && [s.colorDotSel, { borderColor: theme.accentColor }]]} />
                                        ))}
                                    </View>
                                </View>
                                <View style={[s.settingRow, { borderBottomColor: theme.cardBorder }]}>
                                    <Text style={s.settingLabel}>Theme</Text>
                                    <TouchableOpacity
                                        style={[s.themeSelector, { backgroundColor: theme.surfaceBg, borderColor: theme.cardBorder }]}
                                        onPress={() => setShowThemePicker(!showThemePicker)}
                                    >
                                        <CornerAccent shape={theme.cornerShape} color={theme.accentColor} size={8} />
                                        <Text style={s.themeSelectorText}>{theme.name}</Text>
                                        <Ionicons
                                            name={showThemePicker ? "chevron-up" : "chevron-down"}
                                            size={14}
                                            color={Colors.textMuted}
                                        />
                                    </TouchableOpacity>
                                </View>
                                {showThemePicker && (
                                    <View style={s.themeGrid}>
                                        {(Object.keys(THEMES) as ThemeName[]).map((themeKey) => (
                                            <TouchableOpacity
                                                key={themeKey}
                                                style={[
                                                    s.themeOption,
                                                    { backgroundColor: THEMES[themeKey].surfaceBg, borderColor: THEMES[themeKey].cardBorder },
                                                    currentTheme === themeKey && [s.themeOptionSelected, { borderColor: THEMES[themeKey].accentColor }]
                                                ]}
                                                onPress={() => handleThemeChange(themeKey)}
                                            >
                                                <View style={[s.themeSwatch, { backgroundColor: THEMES[themeKey].accentColor + '20' }]}>
                                                    <CornerAccent shape={THEMES[themeKey].cornerShape} color={THEMES[themeKey].accentColor} size={10} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[
                                                        s.themeOptionName,
                                                        currentTheme === themeKey && { color: THEMES[themeKey].accentColor }
                                                    ]}>
                                                        {THEMES[themeKey].name}
                                                    </Text>
                                                    <Text style={s.themeOptionDesc}>{THEMES[themeKey].label}</Text>
                                                </View>
                                                {currentTheme === themeKey && (
                                                    <Ionicons name="checkmark-circle" size={18} color={THEMES[themeKey].accentColor} />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'statistics' && (
                            <View style={s.tabContent}>
                                {[
                                    { label: 'Login Streak', value: profile?.consecutive_days ?? 0, icon: '🔥' },
                                    { label: 'Messages', value: profile?.messages_unlocked ?? 0, icon: '💌' },
                                    { label: 'Stars Found', value: profile?.stars_discovered ?? 0, icon: '✦' },
                                    { label: 'Pet Happiness', value: `${profile?.pet_happiness ?? 100}%`, icon: '🐾' },
                                ].map((st) => (
                                    <View key={st.label} style={[s.statRow, { borderBottomColor: theme.cardBorder }]}>
                                        <Text style={s.statIcon}>{st.icon}</Text>
                                        <Text style={s.statLabel}>{st.label}</Text>
                                        <Text style={[s.statValue, { color: theme.accentColor }]}>{st.value}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    <View style={[s.logoutWrapper, { borderTopColor: theme.cardBorder }]}>
                        <TouchableOpacity style={s.logoutBtn} onPress={() => setShowLogoutModal(true)} activeOpacity={0.75}>
                            <Ionicons name="log-out-outline" size={17} color={Colors.red} />
                            <Text style={s.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Animated.View>

            {/* Logout Modal */}
            <Modal visible={showLogoutModal} transparent animationType="fade"
                onRequestClose={() => setShowLogoutModal(false)}>
                <View style={s.modalOverlay}>
                    <View style={[s.modalBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                        <View style={[s.modalIconCircle, { backgroundColor: Colors.red + '15' }]}>
                            <Ionicons name="log-out-outline" size={26} color={Colors.red} />
                        </View>
                        <Text style={s.modalTitle}>Logout</Text>
                        <Text style={s.modalMsg}>Are you sure you want to logout?</Text>
                        <View style={s.modalBtns}>
                            <TouchableOpacity style={[s.modalBtnCancel, { backgroundColor: theme.surfaceBg, borderColor: theme.cardBorder }]} onPress={() => setShowLogoutModal(false)}>
                                <Text style={s.modalBtnCancelTxt}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.modalBtnConfirm} onPress={confirmLogout}>
                                <Text style={s.modalBtnConfirmTxt}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Profile Modal */}
            <Modal visible={showEditProfile} transparent animationType="fade"
                onRequestClose={() => setShowEditProfile(false)}>
                <View style={s.modalOverlay}>
                    <View style={[s.editModalBox, { backgroundColor: theme.cardBg, borderColor: theme.accentColor + '30' }]}>
                        <Text style={s.editModalTitle}>Edit Profile</Text>
                        <View style={s.inputGroup}>
                            <Text style={s.inputLabel}>Display Name</Text>
                            <TextInput
                                style={[s.textInput, { backgroundColor: theme.surfaceBg, borderColor: theme.accentColor + '15' }]}
                                value={editDisplayName}
                                onChangeText={setEditDisplayName}
                                placeholder="Enter your name"
                                placeholderTextColor={Colors.textMuted}
                                maxLength={30}
                            />
                        </View>
                        <View style={s.inputGroup}>
                            <Text style={s.inputLabel}>Pet Companion</Text>
                            <TouchableOpacity style={[s.petSelector, { backgroundColor: theme.surfaceBg, borderColor: theme.cardBorder }]} onPress={() => setShowPetPicker(!showPetPicker)}>
                                <Text style={s.petSelectorEmoji}>{PETS[editPetType]}</Text>
                                <Text style={s.petSelectorText}>
                                    {editPetType.charAt(0).toUpperCase() + editPetType.slice(1)}
                                </Text>
                                <Ionicons name={showPetPicker ? "chevron-up" : "chevron-down"} size={16} color={Colors.textMuted} />
                            </TouchableOpacity>
                            {showPetPicker && (
                                <View style={[s.petGrid, { backgroundColor: theme.surfaceBg, borderColor: theme.cardBorder }]}>
                                    {PET_TYPES.map((pet) => (
                                        <TouchableOpacity key={pet}
                                            style={[s.petOption, editPetType === pet && [s.petOptionSelected, { borderColor: theme.accentColor, backgroundColor: theme.accentGlow }]]}
                                            onPress={() => { setEditPetType(pet); setShowPetPicker(false); }}>
                                            <Text style={s.petOptionEmoji}>{PETS[pet]}</Text>
                                            <Text style={[s.petOptionLabel, editPetType === pet && { color: theme.accentColor, fontWeight: '600' }]}>
                                                {pet.charAt(0).toUpperCase() + pet.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                        <View style={s.modalBtns}>
                            <TouchableOpacity style={[s.modalBtnCancel, { backgroundColor: theme.surfaceBg, borderColor: theme.cardBorder }]} onPress={() => setShowEditProfile(false)}>
                                <Text style={s.modalBtnCancelTxt}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.modalBtnConfirm, s.saveBtn, { backgroundColor: theme.accentColor }, saving && { opacity: 0.7 }]}
                                onPress={handleSaveProfile} disabled={saving}>
                                <Text style={s.modalBtnConfirmTxt}>{saving ? 'Saving...' : 'Save'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            {/* ── Coming Soon Modal ── */}
            <Modal visible={showComingSoon} transparent animationType="fade"
                onRequestClose={() => setShowComingSoon(false)}>
                <View style={s.modalOverlay}>
                    <View style={[s.comingSoonBox, { backgroundColor: theme.cardBg, borderColor: theme.accentColor + '30' }]}>
                        {/* Caution tape stripes */}
                        <View style={s.cautionTape}>
                            {[...Array(8)].map((_, i) => (
                                <View key={i} style={[s.cautionStripe, { backgroundColor: theme.accentColor + (i % 2 === 0 ? '40' : '15') }]} />
                            ))}
                        </View>

                        {/* Construction icon */}
                        <View style={[s.constructionCircle, { backgroundColor: theme.accentColor + '15', borderColor: theme.accentColor + '30' }]}>
                            <Text style={s.constructionEmoji}>🚧</Text>
                        </View>

                        {/* Feature info */}
                        <Text style={[s.comingSoonFeature, { color: theme.accentColor }]}>
                            {selectedFeature?.icon} {selectedFeature?.name}
                        </Text>
                        <Text style={[s.comingSoonTitle, { color: theme.accentColor }]}>
                            Under Construction!
                        </Text>
                        <Text style={s.comingSoonMsg}>
                            {selectedFeature?.message}
                        </Text>

                        {/* Cute decoration row */}
                        <View style={s.comingSoonDecor}>
                            <Text style={{ fontSize: 14, color: theme.accentColor + '40' }}>{theme.journeyEmoji}</Text>
                            <Text style={[s.comingSoonDecorText, { color: theme.accentColor + '50' }]}>
                                coming soon with extra love
                            </Text>
                            <Text style={{ fontSize: 14, color: theme.accentColor + '40' }}>{theme.journeyTimeEmoji}</Text>
                        </View>

                        {/* Close button */}
                        <TouchableOpacity
                            style={[s.comingSoonBtn, { backgroundColor: theme.accentColor }]}
                            onPress={() => setShowComingSoon(false)}
                        >
                            <Text style={s.comingSoonBtnText}>Got it! ✨</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
        </>
    );
}

function DRow({ label, value, highlight, themeColor, borderColor }: { label: string; value: string; highlight?: boolean; themeColor?: string; borderColor?: string }) {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: borderColor || Colors.border }}>
            <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>{label}</Text>
            <Text style={{ color: highlight ? (themeColor || Colors.yellow) : Colors.textPrimary, fontSize: 12, fontWeight: highlight ? '700' : '400', letterSpacing: highlight ? 1.5 : 0, maxWidth: '55%', textAlign: 'right' }}>{value}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1 },
    container: { flex: 1 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1 },
    burgerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    headerAccent: { width: 5, height: 5, borderRadius: 1, transform: [{ rotate: '45deg' }] },
    headerTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
    petBadge: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    petBadgeEmoji: { fontSize: 18 },

    // Scroll
    scroll: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 36 },

    // Card corner accents
    cardCornerTL: { position: 'absolute', top: 0, left: 0, width: 32, height: 32, borderBottomRightRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderTopWidth: 0, borderLeftWidth: 0 },
    cardCornerTR: { position: 'absolute', top: 0, right: 0, width: 28, height: 28, borderBottomLeftRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderTopWidth: 0, borderRightWidth: 0 },

    // Welcome
    welcomeCard: { borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, borderWidth: 1, overflow: 'hidden' },
    welcomeGreeting: { color: Colors.textMuted, fontSize: 11 },
    welcomeName: { fontSize: 18, fontWeight: '700', marginVertical: 2 },
    welcomeSub: { color: Colors.textSecondary, fontSize: 11 },
    welcomePet: { fontSize: 40, zIndex: 1 },

    // Journey
    journeyCard: { borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, overflow: 'hidden' },
    journeyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, zIndex: 1 },
    journeyBlock: { flex: 1, alignItems: 'center' },
    journeyEmoji: { fontSize: 20, marginBottom: 2 },
    journeyBlockLabel: { color: Colors.textMuted, fontSize: 10, marginBottom: 1 },
    journeyBlockValue: { fontSize: 20, fontWeight: '700' },
    journeyTime: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
    journeyDivider: { width: 1, height: 36, marginHorizontal: 10 },
    journeyDate: { color: Colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 4, zIndex: 1 },

    // Partner
    partnerCard: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 14, borderWidth: 1 },
    partnerDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.red },
    partnerText: { color: Colors.textSecondary, fontSize: 11, flex: 1 },
    partnerName: { color: Colors.textPrimary, fontWeight: '600' },

    // Section
    sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    sectionBar: { width: 2, height: 14, borderRadius: 1 },
    sectionLabel: { color: Colors.textSecondary, fontSize: 10, fontWeight: '600', letterSpacing: 1.8, textTransform: 'uppercase' },

    // Features
    featuresGrid: { gap: 7, marginBottom: 24 },
    featureCard: { borderRadius: 11, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1 },
    featureIconBg: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    featureIcon: { fontSize: 19 },
    featureLabel: { flex: 1, color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
    featureTrail: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    trailDot: { width: 4, height: 4, borderRadius: 2 },

    // Activity
    emptyCard: { borderRadius: 10, padding: 22, alignItems: 'center', marginBottom: 20, borderWidth: 1 },
    emptyIconCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    emptyIcon: { fontSize: 16 },
    emptyText: { color: Colors.textSecondary, fontSize: 12 },
    emptySubtext: { color: Colors.textMuted, fontSize: 11, marginTop: 3 },
    activityList: { gap: 6, marginBottom: 20 },
    activityItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 9, padding: 10, borderWidth: 1 },
    activityDot: { width: 7, height: 7, borderRadius: 4, marginTop: 4 },
    activityText: { color: Colors.textPrimary, fontSize: 11, flex: 1 },
    activityActor: { fontWeight: '700' },
    activityTime: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
    auditBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, borderWidth: 1 },
    auditBadgeText: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Footer
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2 },
    footerLine: { flex: 1, height: 1, maxWidth: 40 },
    footerShape: { width: 18, height: 18, borderRadius: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, transform: [{ rotate: '45deg' }] },

    // Overlay
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10 },

    // Drawer
    drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, width: MENU_WIDTH, zIndex: 20, borderRightWidth: 1 },
    drawerHeader: { paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1, alignItems: 'center' },
    closeBtn: { alignSelf: 'flex-end', padding: 5, marginBottom: 2 },
    drawerAvatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
    drawerAvatarEmoji: { fontSize: 32 },
    drawerName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
    drawerEmail: { color: Colors.textMuted, fontSize: 10, marginTop: 2, maxWidth: '92%' },
    partnerBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
    partnerBadgeText: { color: Colors.textSecondary, fontSize: 10 },

    // Tabs
    tabs: { flexDirection: 'row', borderBottomWidth: 1 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2 },
    tabText: { color: Colors.textMuted, fontSize: 11 },
    tabTextActive: { fontWeight: '600' },

    // Tab content
    tabContent: { padding: 14 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1 },
    settingLabel: { color: Colors.textSecondary, fontSize: 12 },
    colorDot: { width: 22, height: 22, borderRadius: 6 },
    colorDotSel: { borderWidth: 3 },
    statRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 9 },
    statIcon: { fontSize: 18, width: 26, textAlign: 'center' },
    statLabel: { flex: 1, color: Colors.textSecondary, fontSize: 12 },
    statValue: { fontSize: 15, fontWeight: '700' },
    editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 10, padding: 12, borderWidth: 1, marginTop: 14 },
    editBtnText: { fontSize: 12, fontWeight: '600' },

    // Theme Picker
    themeSelector: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
    themeSelectorText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '500' },
    themeGrid: { marginTop: 8, gap: 6 },
    themeOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
    themeOptionSelected: { borderWidth: 2 },
    themeSwatch: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    themeOptionName: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600' },
    themeOptionDesc: { color: Colors.textMuted, fontSize: 10, marginTop: 1 },

    // Edit Profile Modal
    editModalBox: { borderRadius: 16, padding: 22, width: '88%', maxWidth: 400, borderWidth: 1 },
    editModalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 20, textAlign: 'center' },
    inputGroup: { marginBottom: 18 },
    inputLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
    textInput: { borderRadius: 10, padding: 12, color: Colors.textPrimary, fontSize: 14, borderWidth: 1 },
    petSelector: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 12, borderWidth: 1, gap: 10 },
    petSelectorEmoji: { fontSize: 20 },
    petSelectorText: { color: Colors.textPrimary, fontSize: 14, flex: 1 },
    petGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, borderRadius: 10, padding: 10, borderWidth: 1 },
    petOption: { width: '30%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: Colors.black, padding: 8, borderWidth: 1, borderColor: 'transparent' },
    petOptionSelected: { borderWidth: 2 },
    petOptionEmoji: { fontSize: 28, marginBottom: 4 },
    petOptionLabel: { color: Colors.textMuted, fontSize: 10 },

    // Logout
    logoutWrapper: { padding: 14, borderTopWidth: 1 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 11, borderRadius: 9, backgroundColor: Colors.redGlow, borderWidth: 1, borderColor: Colors.red },
    logoutText: { color: Colors.red, fontSize: 13, fontWeight: '500' },

    // Shared Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
    modalBox: { borderRadius: 14, padding: 22, width: '80%', alignItems: 'center', borderWidth: 1 },
    modalIconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 7 },
    modalMsg: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 18 },
    modalBtns: { flexDirection: 'row', gap: 10, width: '100%' },
    modalBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 9, alignItems: 'center', borderWidth: 1 },
    modalBtnCancelTxt: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
    modalBtnConfirm: { flex: 1, paddingVertical: 12, borderRadius: 9, alignItems: 'center', backgroundColor: Colors.red },
    modalBtnConfirmTxt: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
    saveBtn: {},

    // Coming Soon Modal
    comingSoonBox: {
        borderRadius: 16,
        padding: 0,
        width: '88%',
        maxWidth: 380,
        borderWidth: 1,
        overflow: 'hidden',
        alignItems: 'center',
    },
    cautionTape: {
        flexDirection: 'row',
        width: '100%',
        height: 12,
    },
    cautionStripe: {
        flex: 1,
        height: '100%',
    },
    constructionCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 12,
    },
    constructionEmoji: {
        fontSize: 28,
    },
    comingSoonFeature: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    comingSoonTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 10,
    },
    comingSoonMsg: {
        color: Colors.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    comingSoonDecor: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 18,
    },
    comingSoonDecorText: {
        fontSize: 10,
        fontStyle: 'italic',
    },
    comingSoonBtn: {
        width: '100%',
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    comingSoonBtnText: {
        color: '#1A1A2E',
        fontSize: 14,
        fontWeight: '700',
    },
});
