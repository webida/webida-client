/*
 * Copyright (c) 2012-2015 S-Core Co., Ltd.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

require(['core/fs'], function (FS) {
    'use strict';

    console.log('fs loaded', FS);
    describe('Test FS Model', function () {

        beforeEach(function () {
            console.log('>>>>>>> ', this.description);
        });

        var async = new AsyncSpec(this);

        var fsid = '~wabd';
        var fs;
        var timestamp = (new Date()).getTime();
        var tempfile = '/tmp-' + timestamp + '.txt';
        var tempdir = 'tmpdir-' + timestamp;
        var temptxt = 'what a beautiful day..';
        var temptxt2 = 'let there be love and happienss';
        var tempproj = 'tmpproj-' + timestamp;
        var tempmeta = 'meta-' + timestamp;

        var file;
        var dir;
        var ws;
        var metaModel;
        async.it('init', function (done) {
            FS.init(function () {
                fs = new FS.FileSystem(fsid);
                file  = fs.getFile(tempfile);
                dir = fs.getDirectory('/' + tempdir);
                ws = new FS.Workspace(fs, '/ws1');
                //metaModel = file.getMeta();
                done();
            });
        });

        async.it('write file', function (done) {
            file.write(temptxt, function (err) {
                expect(err).toBeFalsy();
                done();
            });
        });
        async.it('read file', function (done) {
            file.read(function (err, content) {
                expect(err).toBeFalsy();
                expect(content).toEqual(temptxt);
                done();
            });
        });
        async.it('stat file', function (done) {
            file.getStat(function (err, stat) {
                expect(err).toBeFalsy();
                expect(stat.name).toEqual(file.name);
                console.log('stat file', arguments);
                done();
            });
        });

        async.it('remove file', function (done) {
            file.remove(function (err) {
                expect(err).toBeFalsy();
                done();
            });
        });

        async.it('create dir', function (done) {
            dir.create(true, function (err) {
                expect(err).toBeFalsy();
                done();
            });
        });
        async.it('stat dir', function (done) {
            dir.getStat(function (err, stat) {
                expect(err).toBeFalsy();
                expect(stat.name).toEqual(dir.name);
                done();
            });
        });
        async.it('list dir', function (done) {
            dir.getList(function (err, list) {
                expect(err).toBeFalsy();
                expect(list.length).toEqual(0);
                done();
            });
        });
        async.it('remove dir', function (done) {
            dir.remove(true, function (err) {
                expect(err).toBeFalsy();
                done();
            });
        });

        async.it('create project', function (done) {
            ws.createProject(tempproj, function (err) {
                expect(err).toBeFalsy();
                done();
            });
        });
        async.it('get projects', function (done) {
            ws.getProjects(function (err, projects) {
                expect(err).toBeFalsy();
                expect(projects.length).toBeGreaterThan(0);
                done();
            });
        });
        async.it('get project', function (done) {
            ws.getProject(tempproj, function (err, project) {
                expect(err).toBeFalsy();
                expect(project.name).toEqual(tempproj);
                done();
            });
        });
        async.it('remove project', function (done) {
            ws.getProject(tempproj, function (err, project) {
                expect(err).toBeFalsy();
                project.remove(function (err) {
                    expect(err).toBeFalsy();
                    done();
                });
            });
        });

        // file events
        async.it('file change event', function (done) {
            file.on('fileChange', function () {
                done();
            });
            file.write(temptxt, function (err) {
                expect(err).toBeFalsy();
            });
        });
        async.it('file remove event', function (done) {
            file.on('fileRemove', function () {
                done();
            });
            file.remove(function (err) {
                expect(err).toBeFalsy();
            });
        });
        async.it('child remove event', function (done) {
            dir.create(true, function (err) {
                expect(err).toBeFalsy();
                var f = new FS.File(dir.fs, dir.path + '/' + 'test.txt');
                f.write(temptxt, function (err) {
                    expect(err).toBeFalsy();
                    f.remove(function (err) {
                        expect(err).toBeFalsy();
                    });
                });
            });
            dir.on('childRemove', function () {
                console.log('on childRemove event');
                dir.remove(true, function (err) {
                    expect(err).toBeFalsy();
                    done();
                });
            });
        });

        // meta
        async.it('get meta model', function (done) {
            file.write(temptxt, function (err) {
                expect(err).toBeFalsy();
                var metaModel = file.getMeta();
                expect(metaModel).toBeTruthy();
                done();
            });
        });

        async.it('set/get meta', function (done) {
            metaModel.set(tempmeta, temptxt);
            var meta = metaModel.get(tempmeta);
            expect(meta).toEqual(temptxt);
            done();
        });
        async.it('meta event', function (done) {
            var newval = temptxt2;
            metaModel.on('change', tempmeta, function (val, oldval) {
                expect(val).toEqual(newval);
                expect(oldval).toEqual(temptxt);
                done();
            });
            metaModel.set(tempmeta, temptxt2);
        });
        async.it('remove file with model', function (done) {
            file.remove(function (err) {
                expect(err).toBeFalsy();
                done();
            });
        });


        // etc

        it('normalize path', function () {
            var r = new FS.Resource(fs, '/a/b/c/');
            expect(r.path).toEqual('/a/b/c');
        });

        it('parent path', function () {
            var r0 = new FS.Resource(fs, '/a');
            expect(r0.getParentPath()).toEqual('');
            var r1 = new FS.Resource(fs, '/a/b/c');
            expect(r1.getParentPath()).toEqual('/a/b');
            var r2 = new FS.Resource(fs, '/a/b/c/');
            expect(r2.getParentPath()).toEqual('/a/b');
        });

        it('model path', function () {
            var r = new FS.Resource(fs, '/a.bb/c..d/e...fff.ff.');
            expect(r.getModelPath()).toEqual(fs.fsid + '.a,bb.c,,d.e,,,fff,ff,');
        });
    });

});
