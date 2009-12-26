/*
 * Copyright (C) 2009 Nikhil Marathe ( nsm.nikhil@gmail.com )
 * This file is distributed under the MIT License. Please see
 * LICENSE for details
 */
#include <iostream>

#include <v8.h>
#include <node.h>
#include <assert.h>

#include <fileref.h>
#include <tag.h>

using namespace v8;
using namespace node;

Local<String> TagLibStringToString( TagLib::String s )
{
    std::string str = s.to8Bit();
    return String::New( str.c_str(), str.length() );
}

static Persistent<FunctionTemplate> tag_constructor_template;

Handle<Value> GetFileTags(const Arguments& args)
{
    if (args.Length() < 1 || !args[0]->IsString())
        return ThrowException(Exception::TypeError(String::New("Expected string 'path' as first argument")));

    String::AsciiValue path(args[0]->ToString());
    TagLib::FileRef f(*path);

    if ( f.isNull() || !f.tag() )
    {
        std::string err = "Error while reading data from ";
        String::Utf8Value val(args[0]->ToString());
        err = err + std::string(*val);
        return ThrowException( Exception::Error(String::New( err.c_str(), err.length() ) ) );
    }

    TagLib::Tag *tag = f.tag();

    Local<Object> tag_obj = tag_constructor_template->GetFunction()->NewInstance();

#define TAGLIB_SET_TAG_STRING( obj, name, value ) \
    obj->Set( String::New( name ), TagLibStringToString( value ) )
    TAGLIB_SET_TAG_STRING( tag_obj, "title", tag->title() );
    TAGLIB_SET_TAG_STRING( tag_obj, "artist", tag->artist() );
    TAGLIB_SET_TAG_STRING( tag_obj, "album", tag->album() );
    TAGLIB_SET_TAG_STRING( tag_obj, "comment", tag->comment() );
    TAGLIB_SET_TAG_STRING( tag_obj, "genre", tag->genre() );
#undef TAGLIB_SET_TAG_STRING

    tag_obj->Set( String::New( "year" ), Integer::New( tag->year() ) );
    tag_obj->Set( String::New( "track" ), Integer::New( tag->track() ) );

    return tag_obj;
}

extern "C" void
init (Handle<Object> target)
{
    HandleScope scope;

    tag_constructor_template = Persistent<FunctionTemplate>::New( FunctionTemplate::New() );

    Local<FunctionTemplate> t = FunctionTemplate::New();
    t->InstanceTemplate()->SetInternalFieldCount(1);

    NODE_SET_METHOD( target, "getFileTags", GetFileTags );
}
