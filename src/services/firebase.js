import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    GithubAuthProvider,
    sendPasswordResetEmail,
    updatePassword,
    updateEmail,
    reauthenticateWithCredential,
    EmailAuthProvider,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged
} from "firebase/auth";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    startAfter,
    limit,
    where
} from "firebase/firestore";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";

import firebaseConfig from "./config";

class Firebase {
    constructor() {
        const app = initializeApp(firebaseConfig);
        getAnalytics(app);

        this.auth = getAuth(app);
        this.db = getFirestore(app);
        this.storage = getStorage(app);
    }

    // AUTH ACTIONS ------------

    createAccount = (email, password) =>
        createUserWithEmailAndPassword(this.auth, email, password);

    signIn = (email, password) =>
        signInWithEmailAndPassword(this.auth, email, password);

    signInWithGoogle = () =>
        signInWithPopup(this.auth, new GoogleAuthProvider());

    signInWithFacebook = () =>
        signInWithPopup(this.auth, new FacebookAuthProvider());

    signInWithGithub = () =>
        signInWithPopup(this.auth, new GithubAuthProvider());

    signOut = () => this.auth.signOut();

    passwordReset = (email) => sendPasswordResetEmail(this.auth, email);

    passwordUpdate = (password) => updatePassword(this.auth.currentUser, password);

    reauthenticate = (currentPassword) => {
        const user = this.auth.currentUser;
        const cred = EmailAuthProvider.credential(user.email, currentPassword);
        return reauthenticateWithCredential(user, cred);
    };

    updateEmail = (currentPassword, newEmail) =>
        this.reauthenticate(currentPassword).then(() =>
            updateEmail(this.auth.currentUser, newEmail)
        );

    onAuthStateChanged = (callback) => onAuthStateChanged(this.auth, callback);

    setAuthPersistence = () =>
        setPersistence(this.auth, browserLocalPersistence);

    // FIRESTORE USER ACTIONS --------------

    addUser = (id, user) => setDoc(doc(this.db, "users", id), user);

    getUser = (id) => getDoc(doc(this.db, "users", id));

    updateProfile = (id, updates) =>
        updateDoc(doc(this.db, "users", id), updates);

    saveBasketItems = (items, userId) =>
        updateDoc(doc(this.db, "users", userId), { basket: items });

    // PRODUCT ACTIONS --------------

    getSingleProduct = (id) => getDoc(doc(this.db, "products", id));

    async getProducts(lastRefKey) {
        let q;
        if (lastRefKey) {
            q = query(
                collection(this.db, "products"),
                orderBy("__name__"),
                startAfter(lastRefKey),
                limit(12)
            );
        } else {
            q = query(
                collection(this.db, "products"),
                orderBy("__name__"),
                limit(12)
            );
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    searchProducts = async (searchKey) => {
        const productsRef = collection(this.db, "products");

        const nameQuery = query(
            productsRef,
            orderBy("name_lower"),
            where("name_lower", ">=", searchKey),
            where("name_lower", "<=", `${searchKey}\uf8ff`),
            limit(12)
        );

        const keywordsQuery = query(
            productsRef,
            orderBy("dateAdded", "desc"),
            where("keywords", "array-contains-any", searchKey.split(" ")),
            limit(12)
        );

        const [nameSnaps, keywordsSnaps] = await Promise.all([
            getDocs(nameQuery),
            getDocs(keywordsQuery)
        ]);

        const products = [
            ...nameSnaps.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            ...keywordsSnaps.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        ];

        // dedupe
        const unique = {};
        products.forEach((p) => (unique[p.id] = p));
        return Object.values(unique);
    };

    getFeaturedProducts = (itemsCount = 12) =>
        getDocs(
            query(
                collection(this.db, "products"),
                where("isFeatured", "==", true),
                limit(itemsCount)
            )
        );

    getRecommendedProducts = (itemsCount = 12) =>
        getDocs(
            query(
                collection(this.db, "products"),
                where("isRecommended", "==", true),
                limit(itemsCount)
            )
        );

    addProduct = (id, product) =>
        setDoc(doc(this.db, "products", id), product);

    editProduct = (id, updates) =>
        updateDoc(doc(this.db, "products", id), updates);

    removeProduct = (id) =>
        deleteDoc(doc(this.db, "products", id));

    generateKey = () => doc(collection(this.db, "products")).id;

    // STORAGE ACTIONS --------------

    async storeImage(id, folder, imageFile) {
        const storageRef = ref(this.storage, `${folder}/${id}`);
        await uploadBytes(storageRef, imageFile);
        return await getDownloadURL(storageRef);
    }

    deleteImage = (id) =>
        deleteObject(ref(this.storage, `products/${id}`));
}

const firebaseInstance = new Firebase();
export default firebaseInstance;
