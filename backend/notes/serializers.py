from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Note, NoteComment

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role', 'domain']


class NoteCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = NoteComment
        fields = ['id', 'note', 'author', 'content', 'created_at', 'updated_at']
        read_only_fields = ['author', 'created_at', 'updated_at']


class NoteSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comments = NoteCommentSerializer(many=True, read_only=True)
    tag_list = serializers.ReadOnlyField()
    
    class Meta:
        model = Note
        fields = [
            'id', 'title', 'description', 'purpose', 'priority', 'author',
            'domain', 'is_public', 'created_at', 'updated_at', 'attachments',
            'tags', 'tag_list', 'comments'
        ]
        read_only_fields = ['author', 'created_at', 'updated_at']


class NoteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = [
            'title', 'description', 'purpose', 'priority', 'domain', 
            'is_public', 'attachments', 'tags'
        ]
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class NoteUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = [
            'title', 'description', 'purpose', 'priority', 'domain', 
            'is_public', 'attachments', 'tags'
        ]


class NoteListSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    tag_list = serializers.ReadOnlyField()
    
    class Meta:
        model = Note
        fields = [
            'id', 'title', 'description', 'purpose', 'priority', 'author',
            'domain', 'is_public', 'created_at', 'tag_list'
        ]
        read_only_fields = ['author', 'created_at']


class NoteFilterSerializer(serializers.Serializer):
    priority = serializers.ChoiceField(choices=Note.PRIORITY_CHOICES, required=False)
    domain = serializers.ChoiceField(choices=User.DOMAIN_CHOICES, required=False)
    author = serializers.IntegerField(required=False)
    is_public = serializers.BooleanField(required=False)
    search = serializers.CharField(required=False)
    tags = serializers.CharField(required=False) 