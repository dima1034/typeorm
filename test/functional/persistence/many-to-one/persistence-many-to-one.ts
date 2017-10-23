import "reflect-metadata";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {expect} from "chai";

describe.only("persistence > many-to-one relation", function() {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should save a category with a post attached", () => Promise.all(connections.map(async connection => {
        const post = new Post("Hello Post");
        await connection.manager.save(post);

        const category = new Category("Hello Category");
        category.post = post;
        await connection.manager.save(category);

        const loadedCategory = await connection.manager.findOneById(Category, 1, { relations: ["post"] });
        expect(loadedCategory).not.to.be.empty;
        loadedCategory!.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Hello Post" } });
    })));

    it("should save a category and a new post by cascades", () => Promise.all(connections.map(async connection => {
        const post = new Post("Hello Post");
        const category = new Category("Hello Category");
        category.post = post;
        await connection.manager.save(category);

        const loadedCategory = await connection.manager.findOneById(Category, 1, { relations: ["post"] });
        expect(loadedCategory).not.to.be.empty;
        loadedCategory!.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Hello Post" } });
    })));

    it("should update exist post by cascades when category is saved", () => Promise.all(connections.map(async connection => {
        const post = new Post("Hello Post");
        await connection.manager.save(post);

        // update exist post from newly created category
        const category = new Category("Hello Category");
        category.post = post;
        post.title = "Updated post";
        await connection.manager.save(category);

        // save once again, just for fun
        await connection.manager.save(category);

        const loadedCategory1 = await connection.manager.findOneById(Category, 1, { relations: ["post"] });
        expect(loadedCategory1).not.to.be.empty;
        loadedCategory1!.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Updated post" } });

        // update post from loaded category
        (loadedCategory1!.post as Post).title = "Again Updated post";
        await connection.manager.save(loadedCategory1);

        const loadedCategory2 = await connection.manager.findOneById(Category, 1, { relations: ["post"] });
        expect(loadedCategory2).not.to.be.empty;
        loadedCategory2!.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Again Updated post" } });
    })));

    it.only("should remove exist post by cascades when category is saved without a post (post is set to null)", () => Promise.all(connections.map(async connection => {
        const post = new Post("Hello Post");
        await connection.manager.save(post);

        // update exist post from newly created category
        const category = new Category("Hello Category");
        category.post = post;
        await connection.manager.save(category);

        const loadedCategory1 = await connection.manager.findOneById(Category, 1, { relations: ["post"] });
        expect(loadedCategory1).not.to.be.empty;
        loadedCategory1!.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Hello Post" } });

        // remove post from loaded category
        loadedCategory1!.post = null;
        console.log("saving ", loadedCategory1);
        await connection.manager.save(loadedCategory1);

        const loadedCategory2 = await connection.manager.findOneById(Category, 1, { relations: ["post"] });
        expect(loadedCategory2).not.to.be.empty;
        loadedCategory2!.should.be.eql({ id: 1, name: "Hello Category" });

        const loadedPost = await connection.manager.findOneById(Post, 1);
        expect(loadedPost).to.be.empty;
    })));

    it("should NOT remove exist post by cascades when category is saved without a post (post is set to undefined)", () => Promise.all(connections.map(async connection => {
        const post = new Post("Hello Post");
        await connection.manager.save(post);

        // update exist post from newly created category
        const category = new Category("Hello Category");
        category.post = post;
        await connection.manager.save(category);

        // load and check if it was correctly saved
        const loadedCategory1 = await connection.manager.findOneById(Category, 1, { relations: ["post"] });
        expect(loadedCategory1).not.to.be.empty;
        loadedCategory1!.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Hello Post" } });

        // remove post from loaded category
        loadedCategory1!.post = undefined;
        await connection.manager.save(loadedCategory1);

        const loadedCategory2 = await connection.manager.findOneById(Category, 1, { relations: ["post"] });
        expect(loadedCategory2).not.to.be.empty;
        loadedCategory2!.should.be.eql({ id: 1, name: "Hello Category", post: { id: 1, title: "Hello Post" } });

        const loadedPost = await connection.manager.findOneById(Post, 1);
        expect(loadedPost).not.to.be.empty;
        loadedPost!.should.be.eql({ id: 1, title: "Hello Post" });
    })));

});