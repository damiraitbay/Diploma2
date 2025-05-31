import { eq, and, desc } from 'drizzle-orm';
import db from '../db.js';
import { posts, users, clubs, postLikes } from '../models/schema.js';
import { getFileUrl, deleteFile } from '../utils/fileUploadService.js';

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts 📧]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Invalid input
 */
export const createPost = async(req, res) => {
    try {
        const { title, content } = req.body;
        const userId = req.user.id;
        const image = req.file ? getFileUrl(req.file.filename) : null;

        let clubId = null;
        if (req.user.role === 'head_admin') {
            const club = await db.select().from(clubs).where(eq(clubs.headId, userId)).get();
            if (club) {
                clubId = club.id;
            }
        }

        await db.insert(posts).values({
            clubId,
            userId,
            title,
            content,
            image,
            likes: 0
        }).run();

        return res.status(201).json({ message: 'Post created successfully' });
    } catch (error) {
        // If there was an error and a file was uploaded, delete it
        if (req.file) {
            deleteFile(req.file.filename);
        }
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts 📧]
 *     parameters:
 *       - in: query
 *         name: clubId
 *         schema:
 *           type: integer
 *         description: Filter posts by club ID
 *     responses:
 *       200:
 *         description: List of posts
 */
export const getAllPosts = async(req, res) => {
    try {
        const { clubId } = req.query;

        let query = db.select({
                id: posts.id,
                title: posts.title,
                content: posts.content,
                image: posts.image,
                likes: posts.likes,
                createdAt: posts.createdAt,
                user: {
                    id: users.id,
                    name: users.name,
                    surname: users.surname,
                },
                club: {
                    id: clubs.id,
                    name: clubs.name,
                }
            })
            .from(posts)
            .leftJoin(users, eq(posts.userId, users.id))
            .leftJoin(clubs, eq(posts.clubId, clubs.id))
            .orderBy(desc(posts.createdAt));

        if (clubId) {
            query = query.where(eq(posts.clubId, clubId));
        }

        const allPosts = await query.all();

        return res.status(200).json(allPosts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a specific post
 *     tags: [Posts 📧]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 */
export const getPostById = async(req, res) => {
    try {
        const postId = req.params.id;

        const post = await db.select({
                id: posts.id,
                title: posts.title,
                content: posts.content,
                image: posts.image,
                likes: posts.likes,
                createdAt: posts.createdAt,
                user: {
                    id: users.id,
                    name: users.name,
                    surname: users.surname,
                },
                club: {
                    id: clubs.id,
                    name: clubs.name,
                }
            })
            .from(posts)
            .leftJoin(users, eq(posts.userId, users.id))
            .leftJoin(clubs, eq(posts.clubId, clubs.id))
            .where(eq(posts.id, postId))
            .get();

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        return res.status(200).json(post);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/posts/my-posts:
 *   get:
 *     summary: Get all posts created by the current user
 *     tags: [Posts 📧]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's posts
 */
export const getUserPosts = async(req, res) => {
    try {
        const userId = req.user.id;

        const userPosts = await db.select({
                id: posts.id,
                title: posts.title,
                content: posts.content,
                image: posts.image,
                likes: posts.likes,
                createdAt: posts.createdAt,
            })
            .from(posts)
            .where(eq(posts.userId, userId))
            .orderBy(desc(posts.createdAt))
            .all();

        return res.status(200).json(userPosts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts 📧]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
export const updatePost = async(req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await db.select().from(posts).where(eq(posts.id, postId)).get();

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if user is the post creator or a super_admin
        if (post.userId !== userId && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const { title, content, image } = req.body;

        await db.update(posts)
            .set({
                title: title || post.title,
                content: content || post.content,
                image: image !== undefined ? image : post.image,
                updatedAt: new Date()
            })
            .where(eq(posts.id, postId))
            .run();

        return res.status(200).json({ message: 'Post updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts 📧]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
export const deletePost = async(req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await db.select().from(posts).where(eq(posts.id, postId)).get();

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.userId !== userId && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        if (postLikes) {
            await db.delete(postLikes).where(eq(postLikes.postId, postId)).run();
        }

        // Delete post
        await db.delete(posts).where(eq(posts.id, postId)).run();

        return res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * @swagger
 * /api/posts/{id}/like:
 *   post:
 *     summary: Like or unlike a post
 *     tags: [Posts 📧]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post liked/unliked successfully
 *       404:
 *         description: Post not found
 */
export const toggleLikePost = async(req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await db.select().from(posts).where(eq(posts.id, postId)).get();

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const existingLike = await db.select()
            .from(postLikes)
            .where(
                and(
                    eq(postLikes.postId, postId),
                    eq(postLikes.userId, userId)
                )
            )
            .get();

        if (existingLike) {
            await db.delete(postLikes)
                .where(
                    and(
                        eq(postLikes.postId, postId),
                        eq(postLikes.userId, userId)
                    )
                )
                .run();

            await db.update(posts)
                .set({
                    likes: post.likes - 1,
                    updatedAt: new Date()
                })
                .where(eq(posts.id, postId))
                .run();

            return res.status(200).json({ message: 'Post unliked successfully' });
        } else {
            await db.insert(postLikes).values({
                postId,
                userId
            }).run();

            await db.update(posts)
                .set({
                    likes: post.likes + 1,
                    updatedAt: new Date()
                })
                .where(eq(posts.id, postId))
                .run();

            return res.status(200).json({ message: 'Post liked successfully' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}